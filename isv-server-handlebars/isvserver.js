const express = require('express');
const { Router } = express;
const fs = require('fs');
const { Server: IOServer } = require('socket.io');
const { Server: HttpServer } = require('http');

const app = express();
const httpServer = new HttpServer(app);
const io = new IOServer(httpServer);

// This server will use handlebars for templating
const handlebars = require('express-handlebars');
const hbs = require("handlebars");

const productRouter = new Router();

const Products = require('./api/products.js');
const productContainer = new Products('./api/products.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
productRouter.use(express.json());
productRouter.use(express.urlencoded({ extended: true }));

// Handlebars settings
app.engine('hbs', 
    handlebars({
        extname: '.hbs',
        defaultLayout: 'index.hbs',
        layoutsDir: __dirname + '/views/layouts',
        partialsDir: __dirname + 'views/partials/'
    })
);
const head = hbs.compile(fs.readFileSync(__dirname + '/views/partials/head.hbs').toString('utf-8'));
hbs.registerPartial('head', head)
const header = hbs.compile(fs.readFileSync(__dirname + '/views/partials/header.hbs').toString('utf-8'));
hbs.registerPartial('header', header)
const footer = hbs.compile(fs.readFileSync(__dirname + '/views/partials/footer.hbs').toString('utf-8'));
hbs.registerPartial('footer', footer)
const indexForms = hbs.compile(fs.readFileSync(__dirname + '/views/partials/indexForms.hbs').toString('utf-8'));
hbs.registerPartial('indexForms', indexForms)
const productTable = hbs.compile(fs.readFileSync(__dirname + '/views/partials/productTable.hbs').toString('utf-8'));
hbs.registerPartial('productTable', productTable)
app.set('view engine', 'hbs');
app.set('views', './views');
app.use(express.static('public'));

// main is sent when performing a get on the root directory
app.get('/', (req, res) => {
    res.render('main');
})

// Add an item with the index form
app.post('/', async (req, res) => {    
    try {
        if( req.body.name == undefined || req.body.price === null || req.body.thumbnail == undefined || req.body.category == undefined || req.body.stock == null || req.body.name == '' || req.body.price === '' || req.body.thumbnail == '' || req.body.category == '' || req.body.stock == '' ) {
            throw 'Missing data. Product needs name, Price, Thumbnail, Category and Stock.'
        }
        let category = req.body.category;
        let subcategory = req.body.subcategory || ' ';
        let name = req.body.name;
        let description = req.body.description || ' ';
        let price = req.body.price;
        let stock = req.body.stock;
        let thumbnail = req.body.thumbnail;
        price = parseFloat(price);
        stock = parseFloat(stock);
        const newProduct = {category:category, subcategory:subcategory, name:name, description:description, price:price, stock:stock, thumbnail:thumbnail};
        const savedProduct = await productContainer.save(newProduct);
        res.render('main', {addedProduct: JSON.stringify(savedProduct), successfulAdd: true});
    } catch (err) {
        res.status(400).send(err);
    }
})

// Edit an item with the index form
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
        let newTimestamp = String(new Date()).slice(0,33);
        let newCategory = prevProduct.category;
        let newCat = prevProduct.cat;
        let newSubcategory = prevProduct.subcategory || '';
        let newName = prevProduct.name;
        let newDescription = prevProduct.description || '';
        let newPrice = prevProduct.price;
        let newStock = prevProduct.stock;
        let newThumbnail = prevProduct.thumbnail;
        if (typeof req.body.timestamp === 'string' && req.body.timestamp !== '') {
            newTimestamp = req.body.timestamp;
        }
        if (typeof req.body.category === 'string' && req.body.category !== '') {
            newCategory = req.body.category;
        }
        if (typeof req.body.subcategory === 'string' && req.body.subcategory !== '') {
            newSubcategory = req.body.subcategory;
        }
        if (typeof req.body.cat === 'string' && req.body.cat !== '') {
            newCat = req.body.cat;
        }
        if (typeof req.body.name === 'string' && req.body.name !== '') {
            newName = req.body.name;
        }
        if (typeof req.body.description === 'string' && req.body.description !== '') {
            newDescription = req.body.description;
        }
        if (!isNaN(req.body.price) && req.body.price && req.body.price !== '') {
            newPrice = parseFloat(req.body.price);
        }
        if (!isNaN(req.body.stock) && req.body.stock && req.body.stock !== '') {
            newStock = parseInt(req.body.stock);
        }    
        if (typeof req.body.thumbnail === 'string' && req.body.thumbnail !== '') {   
            newThumbnail = req.body.thumbnail;
        }
        const newProduct = {timestamp:newTimestamp, category:newCategory, subcategory:newSubcategory, name:newName, description:newDescription, price:newPrice, stock:newStock, thumbnail:newThumbnail, cat:newCat};
        const editProduct = await productContainer.edit(putId, newProduct).catch((err) => {
            throw err
        });
        res.render('main', {successfulEdit: true, editedProduct: JSON.stringify(editProduct, null, 2)});
    } catch (err) {
        res.render('main', {unsuccessfulEdit: true, editError: err});
    }
});

app.get('/products', async (req, res) => {
    let allProducts = []
    try {
        allProducts = await productContainer.getAll();
    } catch (err) {
        res.send(`${err}`);
    }
    res.render('main', {layout: 'products.hbs', productList: allProducts});
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
        let newTitle;
        let newPrice;
        let newThumbnail;
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
httpServer.listen(PORT, () => {
    console.log(`Servidor inicializado en el puerto ${httpServer.address().port}`)
});
httpServer.on("error", err => console.log(`Error en el servidor: ${err}`));

io.on('connection', async (socket) => {
    console.log('Client connected');
    const messages = JSON.parse(await fs.promises.readFile('./api/messages.json', 'utf8'));
    try {
        socket.emit('messages', messages);
    } catch (err) {
        io.sockets.emit('msgError', err.message);
    }
    let products;
    try {
        products = await productContainer.getAll();
        socket.emit('products', products);
    } catch (err) {
        io.sockets.emit('prodError', err.message);
    }
    socket.on('newMessage', async data => {
        try {
            messages.push(data);
            await fs.promises.writeFile('./api/messages.json', JSON.stringify(messages,null,2));
            io.sockets.emit('messages', messages);    
        } catch (err) {
            io.sockets.emit('msgError', err.message);
        }
    });
    socket.on('productEvent', async () => {
        try {
            products = await productContainer.getAll();
            io.sockets.emit('products', products);
        } catch (err) {
            io.sockets.emit('prodError', err.message);
        }
    });
})