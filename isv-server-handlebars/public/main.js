const socket = io.connect()

function checkChatMsg() {
    document.getElementById('msgAlert').innerHTML = 'Please complete all fields correctly';
    document.getElementById('msgAlertWrapper').style.maxHeight = document.getElementById('msgAlert').offsetHeight;
    return false;
}

function addMessage(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const userEmail = document.getElementById('userEmail').value;
    const userMessage = document.getElementById('userMessage').value;
    if (!userEmail || !userMessage || !(userEmail.includes('@'))) return checkChatMsg(event);
    document.getElementById('msgAlertWrapper').style.maxHeight = 0;
    const messageToAdd = {
        author: userEmail,
        timestamp: String(new Date()).slice(0,33),
        text: userMessage
    };
    socket.emit('newMessage', messageToAdd);
};

function checkAddProduct(err) {
    document.getElementById('successfulAddWrapper').style.maxHeight = '0';
    document.getElementById('unsuccessfulAdd').innerHTML = err;
    document.getElementById('unsuccessfulAddWrapper').style.maxHeight = document.getElementById('unsuccessfulAdd').offsetHeight;
    return false;
}

function checkEditProduct(err) {
    document.getElementById('successfulEditWrapper').style.maxHeight = '0';
    document.getElementById('unsuccessfulEdit').innerHTML = err;
    document.getElementById('unsuccessfulEditWrapper').style.maxHeight = document.getElementById('unsuccessfulEdit').offsetHeight;
    return false;
}

async function addProduct(e) {
    e.preventDefault();
    const category = document.getElementById('addCategory').value;
    const subcategory = document.getElementById('addSubcategory').value || '';
    const title = document.getElementById('addTitle').value;
    const description = document.getElementById('addDescription').value || '';
    const price = document.getElementById('addPrice').value;
    const stock = document.getElementById('addStock').value;
    const thumbnail = document.getElementById('addThumbnail').value;
    const productToAdd = {
        timestamp: String(new Date()).slice(0,33),
        category: category,
        cat: category.toLowerCase(),
        subcategory: subcategory,
        name: title,
        description: description,
        price: price,
        stock: stock,
        thumbnail:thumbnail 
    };
    try {
        const res = await fetch(window.location.origin, { 
            method: 'POST', 
            body: JSON.stringify(productToAdd),
            headers: {'Content-Type': 'application/json'},
        });
        if (!res.ok) throw res.text();
        socket.emit('productEvent');
        document.getElementById('unsuccessfulAddWrapper').style.maxHeight = '0';
        document.getElementById('successfulAdd').innerHTML = 'Product added Succesfully!' + JSON.stringify(await res.json(), null, '<br>');
        document.getElementById('successfulAddWrapper').style.maxHeight = document.getElementById('successfulAdd').offsetHeight;
        return false;
    } catch (err) {
        checkAddProduct(await err);
    }
};

async function editProduct(e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('editId').value);
    const category = document.getElementById('editCategory').value;
    const subcategory = document.getElementById('editSubcategory').value || '';
    const title = document.getElementById('editTitle').value;
    const description = document.getElementById('editDescription').value || '';
    const price = parseFloat(document.getElementById('editPrice').value);
    const stock = parseInt(document.getElementById('editStock').value);
    const thumbnail = document.getElementById('editThumbnail').value;
    // if (!id) return checkEditProduct('Missing data.');
    const productToEdit = {
        id: id,
        timestamp: String(new Date()).slice(0,33),
        category: category,
        cat: category.toLowerCase(),
        subcategory: subcategory,
        title: title,
        description: description,
        price: price,
        stock: stock,
        thumbnail:thumbnail 
    }
    try {
        const res = await fetch(window.location.origin + '/edit', { 
            method: 'POST', 
            body: JSON.stringify(productToEdit),
            headers: {'Content-Type': 'application/json'},
        });
        if (!res.ok) throw res.text()
        socket.emit('productEvent');
        document.getElementById('unsuccessfulEditWrapper').style.maxHeight = '0';
        document.getElementById('successfulEdit').innerHTML = 'Product Edited Succesfully! <br>' + JSON.stringify(await res.json(), null, '<br>');
        document.getElementById('successfulEditWrapper').style.maxHeight = document.getElementById('successfulEdit').offsetHeight;
        return false;
    } catch (err) {
        checkEditProduct(await err);
    }
};

function renderMessages (data) {
    const html = data.map((elem, index) => {
        return(`<div>
        <strong>${elem.author}</strong>:
        <span>${elem.timestamp}</span>
        <em>${elem.text}</em>
        </div>`)
    }).join(' ');
    document.getElementById('messages').innerHTML = html;
}

function renderProducts (data) {
    document.querySelectorAll('.productRow').forEach(el => el.remove());
    const html = data.map((elem, index) => {
        return(`<tr class='productRow'>
        <td>${elem.id}</td>
        <td>${elem.category}</td>
        <td>${elem.subcategory}</td>
        <td>${elem.name}</td>
        <td><img src=${elem.thumbnail} alt=${elem.name}></td>
        <td>${elem.price}</td>
        <td>${elem.stock}</td>
        </tr>`)
    }).join(' ');
    const template = document.createElement('template');
    template.innerHTML = html;
    document.getElementById('productTable').appendChild(template.content);
}

socket.on('messages', data => {
    renderMessages(data);
})

socket.on('msgError', data => {
    const html = `Error: ${data}`;
    document.getElementById('messages').innerHTML = html;
})

socket.on('products', data => {
    renderProducts(data);
})

socket.on('prodError', data => {
    const html = `<tr class='productRow'> <td> ${data} </td> </tr>`
    const template = document.createElement('template');
    template.innerHTML = html;
    document.getElementById('productTable').appendChild(template.content);
})