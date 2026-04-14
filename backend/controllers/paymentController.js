// backend/controllers/paymentController.js
const crypto = require('crypto')
const qs = require('qs')
const { Op } = require('sequelize')
const Booking = require('../models/Booking')
const CartItem = require('../models/CartItem')
const Payment = require('../models/Payment')
const Room = require('../models/Room')

require('dotenv').config()

const VNPAY_DRAFT_TTL_MS = 30 * 60 * 1000
const vnpayDrafts = new Map()

function sortObject(obj) {
  const sorted = {}
  const keys = Object.keys(obj).sort()
  keys.forEach((key) => {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, '+')
  })
  return sorted
}

function cleanupExpiredDrafts() {
  const now = Date.now()

  for (const [draftRef, draft] of vnpayDrafts.entries()) {
    const age = now - draft.createdAt
    const processedAge = draft.completedAt ? now - draft.completedAt : 0

    if (age > VNPAY_DRAFT_TTL_MS || processedAge > VNPAY_DRAFT_TTL_MS) {
      vnpayDrafts.delete(draftRef)
    }
  }
}

function generateDraftRef() {
  return `${Date.now()}${crypto.randomInt(100000, 999999)}`
}

function buildVnpCreateDate() {
  return new Date()
    .toISOString()
    .replace(/T/, ' ')
    .replace(/\..+/, '')
    .replace(/-/g, '')
    .replace(/:/g, '')
    .replace(/ /g, '')
}

async function validateBookingDraft({ room_id, check_in, check_out }) {
  const checkInDate = new Date(check_in)
  const checkOutDate = new Date(check_out)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
    return { error: 'Ngày nhận phòng hoặc trả phòng không hợp lệ.' }
  }

  if (checkInDate >= checkOutDate) {
    return { error: 'Ngày check-out phải sau ngày check-in' }
  }

  if (checkInDate < today) {
    return { error: 'Ngày check-in không thể ở trong quá khứ' }
  }

  const room = await Room.findByPk(room_id)
  if (!room) {
    return { error: 'Không tìm thấy phòng' }
  }

  const existingBooking = await Booking.findOne({
    where: {
      room_id,
      status: { [Op.in]: ['pending', 'confirmed', 'completed'] },
      check_in: { [Op.lt]: checkOutDate },
      check_out: { [Op.gt]: checkInDate },
    },
  })

  if (existingBooking) {
    return { error: 'Phòng đã được đặt trong khoảng thời gian này.' }
  }

  const nights =
    (checkOutDate.getTime() - checkInDate.getTime()) /
    (1000 * 60 * 60 * 24)

  return {
    room,
    checkInDate,
    checkOutDate,
    totalAmount: nights * Number(room.price || 0),
  }
}

async function finalizeDraftPayment(draftRef, responseCode) {
  cleanupExpiredDrafts()

  const draft = vnpayDrafts.get(draftRef)
  if (!draft) {
    return { ok: false, code: 'PaymentNotFound' }
  }

  if (draft.result) {
    return draft.result
  }

  if (draft.promise) {
    return draft.promise
  }

  draft.promise = (async () => {
    if (responseCode !== '00') {
      vnpayDrafts.delete(draftRef)
      return { ok: false, code: 'PaymentFailed' }
    }

    const validation = await validateBookingDraft(draft.bookingPayload)
    if (validation.error) {
      vnpayDrafts.delete(draftRef)
      return { ok: false, code: 'RoomUnavailable', error: validation.error }
    }

    const sequelize = Booking.sequelize
    const transaction = await sequelize.transaction()

    try {
      const booking = await Booking.create(
        {
          user_id: draft.user_id,
          room_id: draft.bookingPayload.room_id,
          check_in: validation.checkInDate,
          check_out: validation.checkOutDate,
          guests: Number(draft.bookingPayload.guests || 1),
          note: draft.bookingPayload.note
            ? String(draft.bookingPayload.note).trim()
            : null,
          status: 'confirmed',
        },
        { transaction }
      )

      const payment = await Payment.create(
        {
          user_id: draft.user_id,
          booking_id: booking.booking_id,
          amount: validation.totalAmount,
          method: 'vnpay',
          status: 'success',
        },
        { transaction }
      )

      if (draft.bookingPayload.cart_item_id) {
        await CartItem.destroy({
          where: {
            cart_item_id: draft.bookingPayload.cart_item_id,
            user_id: draft.user_id,
          },
          transaction,
        })
      } else {
        await CartItem.destroy({
          where: {
            user_id: draft.user_id,
            room_id: draft.bookingPayload.room_id,
            check_in: validation.checkInDate,
            check_out: validation.checkOutDate,
          },
          transaction,
        })
      }

      await transaction.commit()

      const result = {
        ok: true,
        code: 'PaymentSuccess',
        bookingId: booking.booking_id,
        paymentId: payment.payment_id,
        amount: validation.totalAmount,
      }

      draft.result = result
      draft.completedAt = Date.now()
      return result
    } catch (err) {
      await transaction.rollback()
      vnpayDrafts.delete(draftRef)
      throw err
    }
  })()

  return draft.promise
}

// 1. TẠO URL THANH TOÁN VNPay – TÍNH TỔNG TIỀN THEO SỐ ĐÊM
exports.createPaymentUrl = async (req, res) => {
  try {
    const { booking_id, room_id, check_in, check_out, guests, full_name, email, phone, note, cart_item_id } = req.body
    const user_id = req.user.id

    console.log('>>> createPaymentUrl body =', req.body, 'user =', req.user)

    cleanupExpiredDrafts()

    if (!booking_id) {
      const validation = await validateBookingDraft({ room_id, check_in, check_out })
      if (validation.error) {
        return res.status(400).json({ error: validation.error })
      }

      const draftRef = generateDraftRef()
      vnpayDrafts.set(draftRef, {
        user_id,
        bookingPayload: {
          room_id,
          check_in,
          check_out,
          guests,
          full_name,
          email,
          phone,
          note,
          cart_item_id,
        },
        totalAmount: validation.totalAmount,
        createdAt: Date.now(),
      })

      let ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress
      if (ipAddr === '::1' || ipAddr === '127.0.0.1') {
        ipAddr = '118.69.176.32'
      }

      const tmnCode = process.env.VNPAY_TMN_CODE
      const secretKey = process.env.VNPAY_HASH_SECRET
      let vnpUrl = process.env.VNPAY_URL
      const returnUrl = process.env.VNPAY_RETURN_URL

      const vnpParams = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: draftRef,
        vnp_OrderInfo: `Thanh toan dat phong ${draftRef}`,
        vnp_OrderType: 'other',
        vnp_Amount: validation.totalAmount * 100,
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: buildVnpCreateDate(),
      }

      const sortedParams = sortObject(vnpParams)
      const signData = qs.stringify(sortedParams, { encode: false })
      const hmac = crypto.createHmac('sha512', secretKey)
      const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')

      sortedParams['vnp_SecureHash'] = signed
      vnpUrl += '?' + qs.stringify(sortedParams, { encode: false })

      return res.json({ paymentUrl: vnpUrl })
    }

    // 1. Lấy booking + room, KHÔNG tin amount từ client
    const booking = await Booking.findOne({
      where: { booking_id, user_id },   // chỉ check id + user
      include: [{ model: Room }],
    })

    if (!booking) {
      console.log('>>> createPaymentUrl: booking not found', { booking_id, user_id })
      return res
        .status(404)
        .json({ error: 'Không tìm thấy đơn đặt phòng thuộc về bạn' })
    }

    // Optional: chặn trạng thái không hợp lệ
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return res
        .status(400)
        .json({ error: 'Đơn này không thể thanh toán nữa' })
    }

    // 2. Tính số đêm & tổng tiền
    const checkInDate = new Date(booking.check_in)
    const checkOutDate = new Date(booking.check_out)
    const nights =
      (checkOutDate.getTime() - checkInDate.getTime()) /
      (1000 * 60 * 60 * 24)

    const roomPrice = Number(booking.Room.price || 0)
    const totalAmount = nights * roomPrice

    console.log(
      '>>> VNPay createPaymentUrl:',
      'booking_id =', booking_id,
      '| nights =', nights,
      '| roomPrice =', roomPrice,
      '| totalAmount =', totalAmount
    )

    // 3. Tạo bản ghi Payment
    const payment = await Payment.create({
      user_id,
      booking_id,
      amount: totalAmount,
      method: 'vnpay', // enum phải có 'vnpay'
      status: 'pending',
    })

    // 4. Tạo URL VNPay
    let ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    if (ipAddr === '::1' || ipAddr === '127.0.0.1') {
      ipAddr = '118.69.176.32'
    }

    const tmnCode = process.env.VNPAY_TMN_CODE
    const secretKey = process.env.VNPAY_HASH_SECRET
    let vnpUrl = process.env.VNPAY_URL
    const returnUrl = process.env.VNPAY_RETURN_URL

    const vnpParams = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: payment.payment_id.toString(),
      vnp_OrderInfo: `Thanh toan don hang ${booking_id}`,
      vnp_OrderType: 'other',
      vnp_Amount: totalAmount * 100,
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: buildVnpCreateDate(),
    }

    const sortedParams = sortObject(vnpParams)
    const signData = qs.stringify(sortedParams, { encode: false })
    const hmac = crypto.createHmac('sha512', secretKey)
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')

    sortedParams['vnp_SecureHash'] = signed
    vnpUrl += '?' + qs.stringify(sortedParams, { encode: false })

    console.log('>>> VNPay URL =', vnpUrl)

    return res.json({ paymentUrl: vnpUrl })
  } catch (err) {
    console.error('>>> createPaymentUrl error:', err)
    return res
      .status(500)
      .json({ error: 'Lỗi server khi tạo URL thanh toán' })
  }
}

// 2. vnpayReturn
exports.vnpayReturn = async (req, res) => {
  let vnpParams = req.query
  const secureHash = vnpParams['vnp_SecureHash']

  delete vnpParams['vnp_SecureHash']
  delete vnpParams['vnp_SecureHashType']

  vnpParams = sortObject(vnpParams)
  const secretKey = process.env.VNPAY_HASH_SECRET
  const signData = qs.stringify(vnpParams, { encode: false })
  const hmac = crypto.createHmac('sha512', secretKey)
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')

  const paymentId = vnpParams['vnp_TxnRef']
  const responseCode = vnpParams['vnp_ResponseCode']

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'

  // log debug
  console.log('>>> vnpayReturn paymentId =', paymentId)
  console.log('>>> vnpayReturn responseCode =', responseCode)

  // URL redirect về FRONTEND, không có /api/payment
  let redirectUrl = `${frontendUrl}/booking-result?paymentId=${paymentId}`

  if (secureHash === signed) {
    try {
      if (vnpayDrafts.has(paymentId)) {
        const draftResult = await finalizeDraftPayment(paymentId, responseCode)

        if (draftResult.ok) {
          redirectUrl = `${frontendUrl}/booking-result?paymentId=${draftResult.paymentId}&bookingId=${draftResult.bookingId}&amount=${draftResult.amount}&method=vnpay&success=true&message=${draftResult.code}`
        } else {
          redirectUrl += `&success=false&message=${draftResult.code}`
        }

        return res.redirect(redirectUrl)
      }

      const payment = await Payment.findByPk(paymentId)
      if (!payment) {
        redirectUrl += '&success=false&message=PaymentNotFound'
        return res.redirect(redirectUrl)
      }

      if (payment.status === 'pending') {
        if (responseCode === '00') {
          await payment.update({ status: 'success' })

          const booking = await Booking.findByPk(payment.booking_id)
          await booking.update({ status: 'confirmed' })

          redirectUrl += '&success=true&message=PaymentSuccess'
        } else {
          // Payment failed/cancelled – delete both payment and booking entirely
          const booking = await Booking.findByPk(payment.booking_id)
          await payment.destroy()
          if (booking) await booking.destroy()

          redirectUrl += '&success=false&message=PaymentFailed'
        }
      } else {
        // IPN đã xử lý trước đó
        redirectUrl += '&success=true&message=AlreadyProcessed'
      }

      return res.redirect(redirectUrl)
    } catch (err) {
      console.error(err)
      redirectUrl += '&success=false&message=ServerError'
      return res.redirect(redirectUrl)
    }
  } else {
    redirectUrl += '&success=false&message=InvalidSignature'
    return res.redirect(redirectUrl)
  }
}


// 3. vnpayIpn
exports.vnpayIpn = async (req, res) => {
  let vnpParams = req.query
  const secureHash = vnpParams['vnp_SecureHash']

  delete vnpParams['vnp_SecureHash']
  delete vnpParams['vnp_SecureHashType']

  vnpParams = sortObject(vnpParams)
  const secretKey = process.env.VNPAY_HASH_SECRET
  const signData = qs.stringify(vnpParams, { encode: false })
  const hmac = crypto.createHmac('hmacSHA512', secretKey)
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')

  const paymentId = vnpParams['vnp_TxnRef']
  const responseCode = vnpParams['vnp_ResponseCode']

  if (secureHash === signed) {
    try {
      if (vnpayDrafts.has(paymentId)) {
        const draftResult = await finalizeDraftPayment(paymentId, responseCode)

        if (draftResult.ok || draftResult.code === 'PaymentFailed') {
          return res.status(200).json({ RspCode: '00', Message: 'Success' })
        }

        if (draftResult.code === 'PaymentNotFound') {
          return res.status(200).json({ RspCode: '01', Message: 'Order not found' })
        }

        return res.status(200).json({ RspCode: '00', Message: draftResult.error || 'Success' })
      }

      const payment = await Payment.findByPk(paymentId)
      if (!payment) {
        return res
          .status(200)
          .json({ RspCode: '01', Message: 'Order not found' })
      }

      if (payment.status !== 'pending') {
        return res.status(200).json({
          RspCode: '02',
          Message: 'Order already confirmed/failed',
        })
      }

      if (responseCode === '00') {
        await payment.update({ status: 'success' })
        const booking = await Booking.findByPk(payment.booking_id)
        await booking.update({ status: 'confirmed' })
      } else {
        // IPN failure – delete booking and payment entirely
        const booking = await Booking.findByPk(payment.booking_id)
        await payment.destroy()
        if (booking) await booking.destroy()
      }

      return res.status(200).json({ RspCode: '00', Message: 'Success' })
    } catch (err) {
      return res
        .status(200)
        .json({ RspCode: '97', Message: 'Server Error' })
    }
  } else {
    return res
      .status(200)
      .json({ RspCode: '97', Message: 'Invalid Signature' })
  }
}

// 4. Thanh toán trực tiếp

exports.directPayment = async (req, res) => {
  try {
    const { booking_id, cart_item_id } = req.body;

    if (!booking_id) {
      return res.status(400).json({ error: 'Thiếu booking_id' });
    }

    // 1. Tìm booking của chính user đang login
    const booking = await Booking.findOne({
      where: { booking_id, user_id: req.user.id },
      include: [{ model: Room }],
    });

    if (!booking) {
      return res.status(404).json({ error: 'Không tìm thấy booking' });
    }

    // Không cho thanh toán lại booking đã completed / cancelled
    if (booking.status === 'cancelled' || booking.status === 'completed') {
      return res
        .status(400)
        .json({ error: 'Đơn này không thể thanh toán nữa' });
    }

    // 2. Tính lại số đêm + tổng tiền
    const checkIn = new Date(booking.check_in);
    const checkOut = new Date(booking.check_out);
    const nights =
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24);

    const roomPrice = Number(booking.Room?.price || 0);
    const totalAmount = nights * roomPrice;

    // 3. Tạo bản ghi Payment method 'direct' ở trạng thái pending
    const payment = await Payment.create({
      user_id: req.user.id,
      booking_id,
      amount: totalAmount,
      method: 'direct',
      status: 'pending',
    });

    // 4. Giữ booking ở trạng thái pending để khách thanh toán tại khách sạn
    booking.status = 'pending';
    await booking.save();

    if (cart_item_id) {
      await CartItem.destroy({
        where: {
          cart_item_id,
          user_id: req.user.id,
        },
      });
    } else {
      await CartItem.destroy({
        where: {
          user_id: req.user.id,
          room_id: booking.room_id,
          check_in: booking.check_in,
          check_out: booking.check_out,
        },
      });
    }

    return res.json({
      message:
        'Đã ghi nhận yêu cầu thanh toán trực tiếp. Đơn phòng đang chờ xác nhận.',
      booking,
      payment,
    });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: 'Lỗi server khi thanh toán trực tiếp' });
  }
};
