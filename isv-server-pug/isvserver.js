const express = require('express');
const { Router } = express;
const fs = require('fs');

const app = express();

const productRouter = new Router();

const Products = require('./api/products.js');
const productContainer = new Products('./api/products.json');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
productRouter.use(express.json());
productRouter.use(express.urlencoded({ extended: false }));

// Pug settings for templating
app.set('view engine', 'pug');
app.set('views', './views');
app.use(express.static('public'));

// public/index.html is sent when performing a get on the root directory
app.get('/', (req, res) => {
    res.render('pages/index.pug');
})

app.post('/', async (req, res) => {
    try {
        if( req.body.title == undefined || req.body.price === null || req.body.thumbnail == undefined || req.body.title == '' || req.body.price === '' || req.body.thumbnail == '' ) {
            throw 'Missing data. Product needs Title, Price and Thumbnail.'
        }
        let title = req.body.title;
        let price = req.body.price;
        let thumbnail = req.body.thumbnail;
        price = parseFloat(price);
        const newProduct = {title:title, price:price, thumbnail:thumbnail};
        const savedProduct = await productContainer.save(newProduct);
        res.render('pages/index.pug', {addedProduct: JSON.stringify(savedProduct), successfulAdd: true});
    } catch (err) {
        res.render('pages/index.pug', {unsuccessfulAdd: true, addError: err});
    }
})

app.post('/edit', async (req, res) => {
    try {
        let putId;
        if (req.body.id != null && req.body.id !== '') {
            putId = req.body.id;
        }
        else{
            throw 'No ID was provided';
        }
        const prevProduct = await productContainer.getById(putId);
        let newTitle = prevProduct.title;
        let newPrice = prevProduct.price;
        let newThumbnail = prevProduct.thumbnail;
        if (typeof req.body.title === 'string' && req.body.title !== '') {
            newTitle = req.body.title;
        }
        if (parseFloat(req.body.price) != null && req.body.price !== '') {
            newPrice = parseFloat(req.body.price);
        }    
        if (typeof req.body.thumbnail === 'string' && req.body.thumbnail !== '') {   
            newThumbnail = req.body.thumbnail;
        }
        const newProduct = {title:newTitle, price:newPrice, thumbnail:newThumbnail};
        const editProduct = await productContainer.edit(putId, newProduct);
        res.render('pages/index.pug', {successfulEdit: true, editedProduct: JSON.stringify(editProduct, null, 2)});
    } catch (err) {
        res.render('pages/index.pug', {unsuccessfulEdit: true, editError: err});
    }
});

app.get('/products', async (req, res) => {
    let allProducts = []
    try {
        allProducts = await productContainer.getAll();
    } catch (err) {
        res.render('pages/productView.pug', {error: err});
    }
    res.render('pages/productView.pug', {productList: allProducts});
})

// get all products from /api/products
productRouter.get('/', async (req, res) => {
    try {
        const allProducts = await productContainer.getAll();
        res.json(allProducts);
    } catch (err) {
        res.send(`${err}`);
    }    
});

// get one product by id from /api/products/:id
productRouter.get('/:id', async (req, res) => {
    try {
        const param = req.params.id;
        const product = await productContainer.getById(param);
        res.json(product);
    } catch (err) {
        res.send(`${err}`);
    }
});

// add one product with a post method to /api/products
productRouter.post('/', async (req, res) => {
    try {
        if( req.body.title == undefined || req.body.price === null || req.body.thumbnail == undefined || req.body.title == '' || req.body.price === '' || req.body.thumbnail == '' ) {
            throw 'Missing data. Product needs Title, Price and Thumbnail.'
        }
        let title = req.body.title;
        let price = req.body.price;
        let thumbnail = req.body.thumbnail;
        price = parseFloat(price);
        const newProduct = {title:title, price:price, thumbnail:thumbnail};
        const savedProduct = await productContainer.save(newProduct);
        res.send(`Producto añadido: ${JSON.stringify(savedProduct)}`);
    } catch (err) {
        res.send(`${err}`);
    }
});

// PUT method to edit a product by ID (this is the one that can be tested with postman)
productRouter.put('/:id', async (req, res) => {
    try {
        const param = req.params.id;
        const prevProduct = productContainer.getById(param);
        let newTitle = prevProduct.title;
        let newPrice = prevProduct.price;
        let newThumbnail = prevProduct.thumbnail;
        if (typeof req.body.title === 'string' && req.body.title !== '') {
            newTitle = req.body.title;
        }
        if (req.body.title != null) {
            newPrice = req.body.price;
        }    
        if (typeof req.body.thumbnail === 'string' && req.body.thumbnail !== '') {   
            newThumbnail = req.body.thumbnail;
        }
        newPrice = parseFloat(newPrice);
        const newProduct = {title:newTitle, price:newPrice, thumbnail:newThumbnail};
        await productContainer.edit(param, newProduct);
        res.json({id:param, ...newProduct});
    } catch (err) {
        res.send(`${err}`);
    }
});

// Delete a product by ID
productRouter.delete('/:id', async (req, res) => {
    try {
        const param = req.params.id;
        await productContainer.deleteById(param);
        res.send(`producto con id: ${param} eliminado exitosamente`);
    } catch (err) {
        res.send(`${err}`);
    }
});

//Router
app.use('/api/products', productRouter);

//Connection
const PORT = 8080;
const server = app.listen(PORT, () => {
    console.log(`Servidor inicializado en el puerto ${server.address().port}`)
});
server.on("error", err => console.log(`Error en el servidor: ${err}`));