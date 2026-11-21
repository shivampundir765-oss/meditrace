const express = require('express');
const cartController = require('../../controllers/cart.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
  addToCartSchema,
  updateCartItemSchema
} = require('../../validators/shop.validator');

const router = express.Router();

router.use(authenticate);

/**
 * @openapi
 * /cart:
 *   get:
 *     summary: View patient cart with subtotal, delivery fee and grand total
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *   post:
 *     summary: Add medicine to cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *   delete:
 *     summary: Clear entire cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 */
router.route('/')
  .get(cartController.getCart)
  .post(validate(addToCartSchema), cartController.addToCart)
  .delete(cartController.clearCart);

/**
 * @openapi
 * /cart/{itemId}:
 *   put:
 *     summary: Update cart item quantity
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 *   delete:
 *     summary: Remove item from cart
 *     tags: [Cart]
 *     security:
 *       - BearerAuth: []
 */
router.route('/:itemId')
  .put(validate(updateCartItemSchema), cartController.updateCartItem)
  .delete(cartController.removeFromCart);

module.exports = router;
