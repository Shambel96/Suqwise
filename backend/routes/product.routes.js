const express = require('express');
const router = express.Router();
const productsCtrl = require('../controllers/products/products');

// GET /products - list products
router.get('/', productsCtrl.getAllProducts);

// GET /products/:id - single product
router.get('/:id', productsCtrl.getProductById);

// POST /products - create
router.post('/', productsCtrl.createProduct);

// PUT /products/:id - update
router.put('/:id', productsCtrl.updateProduct);

// DELETE /products/:id - delete
router.delete('/:id', productsCtrl.deleteProduct);

module.exports = router;
