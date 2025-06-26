// Si quieres usar TMDB, reemplaza el array de ejemplo por la consulta a la API
const TMDB_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlODc5ZWRmNjU5ZGQ0NzVmZmQ1YjYxOGQ1ZDAwZjY3OCIsIm5iZiI6MTc1MDY1ODA2NC43MjYsInN1YiI6IjY4NThlYzEwMTVkNDQ1ZWNhYWNiNTBiNyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ekXvZ24JkCbQqJiKx80kS7H0VDSlxkCnfRjaxz-dBRg";

function fetchPeliculasTMDB() {
  return $.ajax({
    url: 'https://api.themoviedb.org/3/movie/now_playing?language=es-ES&page=1',
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + TMDB_TOKEN
    }
  });
}

function renderPeliculasTMDB(peliculasTMDB) {
  peliculas.length = 0;
  peliculasTMDB.results.slice(0, 9).forEach(p => {
    peliculas.push({
      id: p.id,
      titulo: p.title,
      sinopsis: p.overview ? p.overview.substring(0, 90) + '...' : '',
      imagen: p.poster_path ? `https://image.tmdb.org/t/p/w400${p.poster_path}` : 'https://via.placeholder.com/400x600?text=Sin+Imagen'
    });
  });
  renderPeliculas();
}

// Datos de ejemplo de películas
const peliculas = [
  {
    id: 1,
    titulo: "El Escape Final",
    sinopsis: "Un grupo de amigos planea la fuga más audaz de la década.",
    imagen: "https://via.placeholder.com/400x600?text=Escape+Final"
  },
  {
    id: 2,
    titulo: "Amor en Llamas",
    sinopsis: "Una historia de amor que desafía el destino y el tiempo.",
    imagen: "https://via.placeholder.com/400x600?text=Amor+en+Llamas"
  },
  {
    id: 3,
    titulo: "Galaxia Perdida",
    sinopsis: "Explora los confines del universo en una misión épica.",
    imagen: "https://via.placeholder.com/400x600?text=Galaxia+Perdida"
  }
];

const horarios = ["16:00", "18:30", "21:00"];
const filas = 5, columnas = 6; // 30 asientos
let asientosOcupados = [];
let reservaActual = {};

// Renderizar galería de películas
function renderPeliculas() {
  const $galeria = $("#movie-gallery");
  $galeria.empty();
  peliculas.forEach((p, idx) => {
    $galeria.append(`
      <div class="col-md-4 mb-4">
        <div class="card h-100 shadow-sm">
          <img src="${p.imagen}" class="card-img-top" alt="${p.titulo}">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${p.titulo}</h5>
            <p class="card-text text-light">${p.sinopsis}</p>
            <button class="btn btn-warning mt-auto reservar-btn" data-id="${p.id}">Reservar</button>
          </div>
        </div>
      </div>
    `);
  });
}

// Renderizar select de películas en el modal
function renderPeliculasSelect(selectedId) {
  const $select = $("#peliculaSelect");
  $select.empty();
  peliculas.forEach(p => {
    $select.append(`<option value="${p.id}" ${p.id==selectedId?"selected":""}>${p.titulo}</option>`);
  });
}

// Renderizar asientos
function renderAsientos() {
  const $asientos = $("#asientos");
  $asientos.empty();
  for(let f=0; f<filas; f++) {
    for(let c=0; c<columnas; c++) {
      const num = f*columnas + c + 1;
      const ocupado = asientosOcupados.includes(num);
      $asientos.append(`<div class="asiento${ocupado?" occupied":""}" data-num="${num}">${num}</div>`);
    }
  }
}

// Mostrar modal de reserva
$(document).on("click", ".reservar-btn", function() {
  const id = $(this).data("id");
  renderPeliculasSelect(id);
  renderAsientos();
  $("#horarioSelect").val(horarios[0]);
  $("#asientosError").addClass("d-none");
  $("#reservaModal").modal("show");
});

// Cambiar película en select
$("#peliculaSelect").on("change", function() {
  renderAsientos();
});

// Selección de asientos
$(document).on("click", ".asiento", function() {
  if($(this).hasClass("occupied")) return;
  $(this).toggleClass("selected");
});

// Validar y continuar a pago
$("#formReserva").on("submit", function(e) {
  e.preventDefault();
  const peliculaId = +$("#peliculaSelect").val();
  const horario = $("#horarioSelect").val();
  const asientos = $(".asiento.selected").map(function(){return $(this).data("num");}).get();
  if(asientos.length === 0) {
    $("#asientosError").removeClass("d-none");
    return;
  }
  $("#asientosError").addClass("d-none");
  reservaActual = { peliculaId, horario, asientos };
  $("#reservaModal").modal("hide");
  setTimeout(()=>{
    $("#pagoModal").modal("show");
    $("#formPago")[0].reset();
    $("#pagoError").addClass("d-none");
  }, 400);
});

// Validar pago y confirmar reserva
$("#formPago").on("submit", function(e) {
  e.preventDefault();
  const nombre = $("#nombreTarjeta").val().trim();
  const numero = $("#numeroTarjeta").val().trim();
  const venc = $("#vencimientoTarjeta").val().trim();
  const cvv = $("#cvvTarjeta").val().trim();
  const terminos = $("#terminosCheck").is(":checked");
  if(!nombre || !numero || !venc || !cvv || !terminos) {
    $("#pagoError").removeClass("d-none");
    return;
  }
  $("#pagoError").addClass("d-none");
  // Marcar asientos como ocupados
  asientosOcupados = asientosOcupados.concat(reservaActual.asientos);
  $("#pagoModal").modal("hide");
  mostrarConfirmacion();
});

function mostrarConfirmacion() {
  const peli = peliculas.find(p=>p.id===reservaActual.peliculaId);
  const asientos = reservaActual.asientos.join(", ");
  const detalle = `<b>Película:</b> ${peli.titulo}<br><b>Horario:</b> ${reservaActual.horario}<br><b>Asientos:</b> ${asientos}`;
  $("#detalleReserva").html(detalle);
  $("#confirmacionReserva").fadeIn();
  setTimeout(()=>{
    $("#confirmacionReserva").fadeOut();
    renderAsientos();
  }, 4000);
}

// Inicializar
$(function(){
  fetchPeliculasTMDB().done(renderPeliculasTMDB).fail(function(){
    renderPeliculas(); // fallback local si falla la API
  });
});
