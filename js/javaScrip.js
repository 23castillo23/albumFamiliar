/**
 * Álbum Familiar - Nuestros Recuerdos
 * Puedes editar el array ALBUMS para agregar tus propios álbumes y fotos.
 * Para tus fotos reales: usa rutas como "fotos/cumple-maria/1.jpg" o URLs.
 */

// Todas las imágenes usan carpetas locales: album/album01/, album/album02/, etc.
// Pon tus fotos en esas carpetas con la extensión correcta (.jpg o .png).
const ALBUMS = [
  {
    id: 'cumple-maria',
    name: 'Cumpleaños de María',
    coverImage: 'album/album01/KatDennings01.jpg',
    icon: '🎂',
    photos: [
      { src: 'album/album01/KatDennings01.jpg', caption: 'Fiesta de cumpleaños' },
      { src: 'album/album01/KatDennings02.jpg', caption: 'Pastel' }      
    ],
  },
  {
    id: 'xv-anos-carla',
    name: 'XV Años de Carla',
    coverImage: 'album/album02/WallFamosas01.jpg',
    icon: '👑',
    photos: [
      { src: 'album/album02/WallFamosas01.jpg', caption: 'Fiesta XV años' },
      { src: 'album/album02/WallFamosas02.jpg', caption: 'Decoración' }      
    ],
  },
  {
    id: 'vacaciones-2024',
    name: 'Vacaciones 2024',
    coverImage: 'album/album03/WallFamosas01.jpg',
    icon: '🏖️',
    photos: [
      { src: 'album/album03/WallFamosas01.jpg', caption: 'Playa en familia' },
      { src: 'album/album03/WallFamosas02.jpg', caption: 'Atardecer' },      
    ],
  },
  {
    id: 'navidad-familia',
    name: 'Navidad en familia',
    coverImage: 'album/album04/WallFamosas01.jpg',
    icon: '🎄',
    photos: [
      { src: 'album/album04/WallFamosas01.jpg', caption: 'Árbol navideño' },
      { src: 'album/album04/WallFamosas02.jpg', caption: 'Regalos' }      
    ],
  },
  {
    id: 'boda-hermanos',
    name: 'Boda de los hermanos',
    coverImage: 'album/album05/WallGirl01.jpg',
    icon: '💒',
    photos: [
      { src: 'album/album05/WallGirl01.jpg', caption: 'Día de la boda' },
      { src: 'album/album05/WallGirl02.jpg', caption: 'Familia' },      
    ],
  },
];

const albumsGrid = document.getElementById('albumsGrid');
const gallerySection = document.getElementById('gallerySection');
const albumsSection = document.querySelector('.albums-section');
const photosGrid = document.getElementById('photosGrid');
const galleryTitle = document.getElementById('galleryTitle');
const btnBack = document.getElementById('btnBack');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxPrev = document.getElementById('lightboxPrev');
const lightboxNext = document.getElementById('lightboxNext');

let currentAlbum = null;
let currentPhotoIndex = 0;

function renderAlbums() {
  albumsGrid.innerHTML = ALBUMS.map((album) => `
    <article class="album-card" data-album-id="${album.id}" tabindex="0">
      <div class="album-cover">
        ${album.coverImage
          ? `<img src="${album.coverImage}" alt="${escapeHtml(album.name)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.classList.add('show')"><span class="album-icon album-icon-fallback" aria-hidden="true">${album.icon}</span>`
          : `<span class="album-icon" aria-hidden="true">${album.icon}</span>`
        }
      </div>
      <div class="album-info">
        <h3 class="album-name">${escapeHtml(album.name)}</h3>
        <p class="album-count">${album.photos.length} ${album.photos.length === 1 ? 'foto' : 'fotos'}</p>
      </div>
    </article>
  `).join('');

  albumsGrid.querySelectorAll('.album-card').forEach((card) => {
    card.addEventListener('click', () => openAlbum(card.dataset.albumId));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openAlbum(card.dataset.albumId);
      }
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function openAlbum(albumId) {
  currentAlbum = ALBUMS.find((a) => a.id === albumId);
  if (!currentAlbum) return;

  galleryTitle.textContent = currentAlbum.name;
  photosGrid.innerHTML = currentAlbum.photos
    .map(
      (photo, index) => `
    <div class="photo-item" data-index="${index}" tabindex="0" role="button">
      <img src="${photo.src}" alt="${escapeHtml(photo.caption || '')}" loading="lazy">
    </div>
  `
    )
    .join('');

  photosGrid.querySelectorAll('.photo-item').forEach((item) => {
    const index = parseInt(item.dataset.index, 10);
    item.addEventListener('click', () => openLightbox(index));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(index);
      }
    });
  });

  albumsSection.classList.add('hidden');
  gallerySection.classList.add('visible');
  gallerySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeAlbum() {
  albumsSection.classList.remove('hidden');
  gallerySection.classList.remove('visible');
  currentAlbum = null;
}

function openLightbox(index) {
  if (!currentAlbum || !currentAlbum.photos[index]) return;
  currentPhotoIndex = index;
  const photo = currentAlbum.photos[index];
  lightboxImg.src = photo.src;
  lightboxImg.alt = photo.caption || '';
  lightboxCaption.textContent = photo.caption || '';
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
  lightboxClose.focus();
}

function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}

function showPhotoAtIndex(index) {
  if (!currentAlbum) return;
  const len = currentAlbum.photos.length;
  currentPhotoIndex = (index + len) % len;
  const photo = currentAlbum.photos[currentPhotoIndex];
  lightboxImg.src = photo.src;
  lightboxImg.alt = photo.caption || '';
  lightboxCaption.textContent = photo.caption || '';
}

btnBack.addEventListener('click', closeAlbum);

lightboxClose.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', () => showPhotoAtIndex(currentPhotoIndex - 1));
lightboxNext.addEventListener('click', () => showPhotoAtIndex(currentPhotoIndex + 1));

lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('active')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') showPhotoAtIndex(currentPhotoIndex - 1);
  if (e.key === 'ArrowRight') showPhotoAtIndex(currentPhotoIndex + 1);
});

renderAlbums();
