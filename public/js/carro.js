import { actualizarNumeroCarrito} from './localStorage.js';
document.getElementById("botonCarro").addEventListener("click", function() {
    window.location.href = "http://localhost:8008/carro"; 
})

let lista =[];

let checkout = [];  //checkout es el array donde guardo los objetos con el formato que voy a guardar en mi servidor cuando se haga la compra
let precioTotal = 0;
let itemsTotales = 0;

const grilla = document.getElementById('compras');


const carrito = JSON.parse(localStorage.getItem('carrito')) || []; //carrito es el localstorage donde están los ids de los objetos que se eligieron

const domItems = document.getElementById('items-totales');
const domPrecio = document.getElementById('precio-total');

let carritoTemporal = [] //este carrito es temporal, lo lleno con los items que coinciden con el id que guardo dentro del localstorage. Es el previo a "checkout"

actualizarNumeroCarrito() 

fetch('/api')
.then(response => {
    return response.json();
})
.then(async data => { //hago otro fetch a la api en la pagina del carrito porque me parece mas seguro usar los objetos directo del servidor que guardarlos en el localstorage
  lista = data      //una vez tengo los objetos traidos desde la api los uso para compararlos con con los id que sí guardo en el localstorage
                    //estos id representan los objetos que son añadidos al carrito 

  carrito.forEach(id => { //en este foreach recorro el array de ids guardado en el localstorage y en otro array pongo los items que corresponden
    const obj = lista.find(item => item.id.toString() === id); 
    if (obj) {
        const checkoutItem = { //le doy formato a lo que va a ser el checkout que voy a guardar en el json en mi servidor
            ...obj,
            cantidad: 1, //añado la key value cantidad a cada item, y tambien el subtotal que se inicia con el precio final (si tiene descuento)
            subtotal: obj.precioFinal ? obj.precioFinal : obj.price 
        };
    
        carritoTemporal.push(obj)
        checkout.push(checkoutItem)
        
        precioTotal += parseFloat(obj.precioFinal ? obj.precioFinal : obj.price);
        itemsTotales++;
    }
});

precioTotal = parseFloat(precioTotal.toFixed(2));

checkout.unshift({ precioTotal: precioTotal, itemsTotales: itemsTotales });//así me aseguro que se mantenga en primer lugar del array, un objeto "resumen" de la compra

    if(carrito.length != 0){
        crearCarrito()
    }else{
        const vacio = document.getElementById('vacio')
        vacio.innerHTML = "El carrito de compras está vacío, a comprar!!";
    }
})
.catch(error => {
    console.error('error:', error);
});

function crearCarrito(){

    grilla.innerHTML = '';

    carritoTemporal.forEach(item =>{
        let descri = item.description.slice(0, 100) + '...';       //guardo la descripcion cortada en 30 caracteres para mostrarla
        const productoHTML = ` <div class="card mb-3" id="${item.id}">
            <div class="card-body d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center image-container">
                <img src="${item.image}" class="mr-3" alt="Item Image"> 
                <div class="ml-3"> 
                    <h5 class="card-title">${item.title}</h5>
                    <p class="card-text" data-toggle="tooltip" data-placement="bottom" title="${item.description}">${descri}</p>
                    <span class="${item.booleano ? 'oferta' : ''}" id="original${item.id}">$${item.price}</span> 
                    <span id="precio${item.id}" class="${item.booleano ? '' : 'oculta'}">$${item.precioFinal}</span> 
                    <p class="card-text" id="subtotal${item.id}">Subtotal: $${item.booleano ? item.precioFinal : item.price}</p>
                </div>
                </div>
                <div class="d-flex align-items-center">
                <button type="button" class="btn btn-primary btn-sm mr-2 btn-menos btn-cantidad-boton" data-item-id="${item.id}" title = "Quitar cantidad">
                    <i class="fas fa-minus"></i>
                </button>
                <span class="quantity mr-2" id="cantidad${item.id}">1</span>
                <button type="button" class="btn btn-primary btn-sm ml-2 btn-mas cantidad-boton" data-item-id="${item.id}"  title = "Sumar cantidad">
                    <i class="fas fa-plus"></i>
                </button>
                <button type="button" class="btn btn-danger btn-sm ml-2 delete-btn" data-item-id="${item.id}" title = "Eliminar del carrito">
                    <i class="fas fa-times"></i>
                </button>
                </div>
                </div>                 
            </div>`
    
    grilla.innerHTML += productoHTML;
    })


    if (domItems && domPrecio && checkout.length > 0) {
        domItems.textContent = checkout[0].itemsTotales;
        domPrecio.textContent = `${checkout[0].precioTotal.toFixed(2)}`
    }

    document.addEventListener('click', function(event) {
        const botonBorrar = event.target.closest('.delete-btn')
        if (botonBorrar) {
            const itemId = parseInt(botonBorrar.dataset.itemId)
            if (confirm("Estás seguro que querés dejar este artículo?")) {
                const iElementoBorrado = checkout.findIndex(item => item.id === itemId);
                if (iElementoBorrado !== -1) { //actualizo el primer elemento del checkout que es mi carrito restandole los datos del elemento borrado
                    const elementoBorrado = checkout[iElementoBorrado]

                    checkout.splice(iElementoBorrado, 1);
                    checkout[0].precioTotal -= parseFloat(elementoBorrado.subtotal)
                    checkout[0].itemsTotales -= elementoBorrado.cantidad
                }
    
                const index = carritoTemporal.findIndex(item => item.id === itemId)
                if (index !== -1) {
                    carritoTemporal.splice(index, 1)
                }
    
                const carritoIds = JSON.parse(localStorage.getItem('carrito')) || [];
                const carritoActualizado = carritoIds.filter(id => id !== itemId.toString()); //actualizo el carrito del localstorage que tiene solamente ids
                localStorage.setItem('carrito', JSON.stringify(carritoActualizado))
    
                botonBorrar.closest('.card').remove();
    
                if (domItems && domPrecio) {
                    domItems.textContent = checkout[0].itemsTotales;
                    domPrecio.textContent = `${checkout[0].precioTotal.toFixed(2)}`
                }
    
                actualizarNumeroCarrito();
            }
        }
    });
    

    document.addEventListener('click', function(event) {
        const btnMenos = event.target.closest('.btn-menos');
        const btnMas = event.target.closest('.btn-mas')
    
        if (!btnMenos && !btnMas) {
            return;
        }
    
        if (btnMenos) {
            const itemId = parseInt(btnMenos.dataset.itemId)
            actualizarItemCarrito(itemId, -1); 
        }
    
        if (btnMas) {
            const itemId = parseInt(btnMas.dataset.itemId)
            actualizarItemCarrito(itemId, 1);
        }
    
        if (domItems && domPrecio) {
            domItems.textContent = checkout[0].itemsTotales;
            domPrecio.textContent = `${checkout[0].precioTotal.toFixed(2)}`
        }
    
        //console.log('Checkout :', checkout);
    });
    
}



function actualizarItemCarrito(itemId, cambioDeCantidad) { //la funcion actualiza el dom y tambien el carrito que voy a pasar como objeto a ser guardado en un json
    const itemIndex = checkout.findIndex(item => item.id === itemId);

    if (itemIndex !== -1) {
        const item = checkout[itemIndex];
        const nuevaCantidad = item.cantidad + cambioDeCantidad

        const cantidad = Math.max(nuevaCantidad, 0);

        const subtotal = item.precioFinal ? item.precioFinal * cantidad : item.price * cantidad;

        checkout[itemIndex] = {
            ...item,
            cantidad: cantidad,
            subtotal: subtotal
        };

        if (itemIndex === 0) {
            checkout[0].precioTotal = checkout.slice(1).reduce((total, item) => total + item.subtotal, 0)
            checkout[0].itemsTotales = checkout.slice(1).reduce((total, item) => total + item.cantidad, 0)
        } else {
            checkout[0].precioTotal += cambioDeCantidad * (item.precioFinal || item.price)
            checkout[0].itemsTotales += cambioDeCantidad
        }

        const cantidadSpan = document.getElementById(`cantidad${itemId}`);
        const subtotalP = document.getElementById(`subtotal${itemId}`)
        if (cantidadSpan && subtotalP) {
            cantidadSpan.textContent = cantidad
            subtotalP.textContent = `Subtotal: ${subtotal.toFixed(2)}`
        }
    }
}

document.querySelector('.boton-comprar').addEventListener('click', function() {
    if (checkout.length < 2) {
        alert('El carrito está vacío')
        return; 
    }
    if(confirm("Estás seguro que querés hacer esta compra?")){
        const json = JSON.stringify(checkout)
        //console.log(json)
        fetch('/compra', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: json
            })
            .then(data => {
                localStorage.setItem('carrito', JSON.stringify([]));
                checkout = []
                alert("Compra hecha correctamente! Gracias por su plata!")
                window.location.href = 'index.html'
            })
            .catch(error => {
            console.error('Error eviando compra:', error)
            });
        }
});