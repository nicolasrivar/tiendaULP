import { actualizarNumeroCarrito} from './localStorage.js';
document.getElementById("botonCarro").addEventListener("click", function() {
    window.location.href = "https://tiendaulp.onrender.com/carro"; 
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

    carrito.forEach(item => {
    const obj = lista.find(listItem => listItem.id.toString() === item.id); 
    if (obj) {
        const checkoutItem = {
        ...obj,
        cantidad: item.cantidad, 
        subtotal: obj.precioFinal ? obj.precioFinal : obj.price 
        };

        carritoTemporal.push(checkoutItem);
        checkout.push(checkoutItem);

        precioTotal += parseFloat(obj.precioFinal ? obj.precioFinal : obj.price) * item.cantidad;
        itemsTotales += item.cantidad;
    }
    });

precioTotal = parseFloat(precioTotal.toFixed(2));

checkout.unshift({ precioTotal: precioTotal, itemsTotales: itemsTotales });//así me aseguro que se mantenga en primer lugar del array un objeto "resumen" de la compra

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

    carritoTemporal.forEach(item =>{ // muestro el template html de los items que estan en el carrito
        //console.log(item)
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
                    <p class="card-text" id="subtotal${item.id}">Subtotal: $${item.booleano ? (item.precioFinal * item.cantidad).toFixed(2) : (item.price *item.cantidad).toFixed(2)}</p>
                </div>
                </div>
                <div class="d-flex align-items-center">
                <button type="button" class="btn btn-primary btn-sm mr-2 btn-menos btn-cantidad-boton" data-item-id="${item.id}" title = "Quitar cantidad">
                    <i class="fas fa-minus"></i>
                </button>
                <span class="quantity mr-2" id="cantidad${item.id}">${item.cantidad}</span>
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


    if (domItems && domPrecio && checkout.length > 0) { //tomo de mi objeto resumen la cantidad y precio total de items y lo muestro en el resumen de compra
        domItems.textContent = checkout[0].itemsTotales;
        domPrecio.textContent = `${checkout[0].precioTotal.toFixed(2)}`
    }

    document.addEventListener('click', function(event) { //listener del boton de borrar articulo del carrito
        const botonBorrar = event.target.closest('.delete-btn');
        
        if (botonBorrar) {
            const itemId = parseInt(botonBorrar.dataset.itemId);
            
            if (confirm("Estás seguro que querés dejar este artículo?")) {
                const iElementoBorrado = checkout.findIndex(item => item.id === itemId);
    
                if (iElementoBorrado !== -1) { //actualizo el elemento checkout, que es mi carrito definitivo
                    const elementoBorrado = checkout[iElementoBorrado];
                    checkout.splice(iElementoBorrado, 1);
                    checkout[0].precioTotal -= parseFloat(elementoBorrado.subtotal);
                    checkout[0].itemsTotales -= elementoBorrado.cantidad;
                }
    
                const index = carritoTemporal.findIndex(item => item.id === itemId);

                if (index !== -1) {
                    carritoTemporal.splice(index, 1);
                }
    
                let carrito = JSON.parse(localStorage.getItem('carrito')) || []; //actualizo el carrito del localstorage
                carrito = carrito.filter(item => item.id !== itemId.toString());
                localStorage.setItem('carrito', JSON.stringify(carrito));
    
                botonBorrar.closest('.card').remove(); //borro la carta del articulo del html
    
                if (domItems && domPrecio) {                //actualizo el resumen de compra del htlm
                    domItems.textContent = checkout[0].itemsTotales;
                    domPrecio.textContent = `${checkout[0].precioTotal.toFixed(2)}`;
                }
                actualizarNumeroCarrito();

                if (carrito.length === 0) {
                    const vacio = document.getElementById('compras');
                    vacio.innerHTML = `            <div class="d-flex justify-content-center align-items-center vh-100">
                    <p id="vacio" class="text-center display-4">El carrito está vacío, a comprar!!</p>
                  </div>`;
                }

            }
        }
    });
    

    document.addEventListener('click', function(event) { //este event listener es para los botones + y - de los articulos del carrito
        const btnMenos = event.target.closest('.btn-menos');
        const btnMas = event.target.closest('.btn-mas');
    
        if (!btnMenos && !btnMas) {
            return;
        }
    
        let itemId;
        let cambioDeCantidad;
    
        if (btnMenos) {
            itemId = parseInt(btnMenos.dataset.itemId);
            cambioDeCantidad = -1;
        }
    
        if (btnMas) {
            itemId = parseInt(btnMas.dataset.itemId);
            cambioDeCantidad = 1;
        }
    
        if (itemId !== undefined && cambioDeCantidad !== undefined) {
            actualizarItemCarrito(itemId, cambioDeCantidad);
            actualizarLocalStorage(itemId, cambioDeCantidad);
        }
    
        if (domItems && domPrecio) {
            domItems.textContent = checkout[0].itemsTotales;
            domPrecio.textContent = `${checkout[0].precioTotal.toFixed(2)}`
        }
    });
}

function actualizarLocalStorage(itemId, cambioDeCantidad) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    const itemIndex = carrito.findIndex(item => item.id === itemId.toString());

    if (itemIndex !== -1) {
        const nuevaCantidad = carrito[itemIndex].cantidad + cambioDeCantidad;

        if (nuevaCantidad < 1) {
            //alert('La cantidad no puede ser menor que 1');
            return; 
        }

        carrito[itemIndex].cantidad = nuevaCantidad;

        if (carrito[itemIndex].cantidad === 0) {
            carrito.splice(itemIndex, 1);
        }
        localStorage.setItem('carrito', JSON.stringify(carrito));
    }
}

function actualizarItemCarrito(itemId, cambioDeCantidad) { //la funcion actualiza el dom y tambien el carrito que voy a pasar como objeto a ser guardado en un json
    const itemIndex = checkout.findIndex(item => item.id === itemId);

    if (itemIndex !== -1) {
        const item = checkout[itemIndex];
        const nuevaCantidad = item.cantidad + cambioDeCantidad

        if (nuevaCantidad < 1) {
            alert('La cantidad no puede ser menor que 1.');
            return;
        }

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
            subtotalP.textContent = `Subtotal: $${subtotal.toFixed(2)}`
        }
    }
}

document.querySelector('.boton-comprar').addEventListener('click', function() { //si se confirma, hago el post con el checkout que armé, reseteo el localstorage y guardo la compra
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