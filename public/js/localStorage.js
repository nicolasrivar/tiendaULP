export function actualizarNumeroCarrito() {
    const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    const badgefa = document.querySelector('.badge');
    badgefa.textContent = carrito.length.toString();
    //console.log(carrito.length)
  }

export function encontrarId(array, id) {
  return array.find(obj => obj.id === id);
}