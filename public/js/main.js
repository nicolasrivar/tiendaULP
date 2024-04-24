import { actualizarNumeroCarrito } from './localStorage.js';

//url = "https://fakestoreapi.com/products?limit=12" // decidí mostrar menos productos porque la api de traduccion no soporta tantas requests
let lista =[];

const grilla = document.getElementById('grilla')
const carrito = JSON.parse(localStorage.getItem('carrito')) || []; //busco la key "carrito" en mi localstorage, si no está, inicializa como array vacío
 //en el localstorage guardo solamente las ids de los articulos que se añaden al carrito
fetch('/api')
.then(response => {
    return response.json();
})
.then(async data => { //hago un get a mi localhost, donde devuelvo la api traducida, modificada con los descuentos y lista para mostrarla en html
  lista = data
  //console.log(lista)
       
    crearHTML() //llamo a la funcion que crea el formato html con los items y los eventlisteners
})
.catch(error => {
    console.error('error:', error);
});

document.getElementById("botonCarro").addEventListener("click", function() {
  window.location.href = "https://tiendaulp.onrender.com/carro"; })


function crearHTML() {
  
    grilla.innerHTML = '';

    lista.forEach(item => {
      //console.log(item)
    let descri = item.description.slice(0, 30) + '...';       //guardo la descripcion cortada en 30 caracteres para mostrarla
    const productoHTML = `<div class="col-md-3 py-md-5 px-2" id="${item.id}">
    <div class="card d-flex flex-column h-100">
        <div class="image-container d-flex justify-content-center align-items-center">
            <img src="${item.image}" alt="" class="img-fluid mx-auto">
            <img src="image/oferta.png" alt="" class="sobrepuesta img-fluid ${item.booleano ? '' : 'oculta'}" id="img${item.id}">
        </div>  
        <div class="card-body flex-fill d-flex flex-column justify-content-between">
            <div>
                <h3 class="text-center" id="titulo">${item.title}</h3>
                <p class="text-center" data-toggle="tooltip" data-placement="bottom" title="${item.description}">${descri}</p>
                <p class="text-center">Categoria: ${item.category}</p>
                <h2 class="d-flex align-items-center justify-content-center">
                    <span class="${item.booleano ? 'oferta' : ''}" id="original${item.id}">$${item.price}</span>
                    <span id="precio${item.id}" class="${item.booleano ? '' : 'oculta'}">$${item.precioFinal}</span>
                </h2>
                <div class="text-center">
                    <span class="ml-auto porcentaje ${item.booleano ? '' : 'oculta'}" id="descuento${item.id}">-%${item.descuento}! (-$${item.montoDescontado})</span>
                </div>
            </div>
              <div class="text-center">
                <button type="button" class="btn btn-primary btn-icon-shadow mt-2 carrito-btn" data-item-id="${item.id}" title = "Agregar al carrito.">
                    <i class="fa-solid fa-cart-shopping"></i>
                </button>
              </div>
          </div>
      </div>
    </div>`;
  
    grilla.innerHTML += productoHTML;
    });


    actualizarBotones()

    actualizarNumeroCarrito()
  
    grilla.addEventListener('click', function(event) {
      const button = event.target.closest('.carrito-btn');
    
      if (button && !button.classList.contains('disabled')) { 
        const itemId = button.dataset.itemId;
    
        // Check if the item is already in the cart
        const itemIndex = carrito.findIndex(item => item.id === itemId);
    
        if (itemIndex === -1) {
          // If item is not in the cart, add it as an object
          const newItem = { id: itemId, cantidad: 1 };
          carrito.push(newItem);
          localStorage.setItem('carrito', JSON.stringify(carrito));
    
          button.classList.add('disabled');
          const icon = button.querySelector('i');
          icon.classList.remove('fa-cart-shopping');
          icon.classList.add('fa-check');
    
          alert('Artículo añadido al carrito!');
        } else {
          // If item is already in the cart, increment its quantity
          carrito[itemIndex].cantidad++;
          localStorage.setItem('carrito', JSON.stringify(carrito));
    
          alert('El artículo ya se encuentra en el carrito');
        }
      }
    
      actualizarNumeroCarrito();
    });
  }

  

//no conviene hacer 2 fetchs por problemas de timing.
/*fetch('/descuentos')
.then(response => {
    return response.json();
})
.then(data => {
    document.addEventListener('DOMContentLoaded', function() {
        data.forEach(item => {
            id = "img" + item.id
            let imagen = document.getElementById(id);
            console.log(imagen)
            imagen.classList.remove("oculta");

        });
    });

})

.catch(error => {
    console.error('Error:', error);
});

*/

function actualizarBotones() {
  const botones = document.querySelectorAll('.carrito-btn');
  botones.forEach(button => {
    const itemId = button.dataset.itemId;

    // Check if the item is in the cart
    const itemInCart = carrito.find(item => item.id === itemId);

    if (itemInCart) {
      button.classList.add('disabled');
      const icon = button.querySelector('i');
      icon.classList.remove('fa-cart-shopping');
      icon.classList.add('fa-check');
    }
  });
}