// Bütün tab düymələrini və məzmun bloklarını tap
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const targetTab = button.dataset.tab;

    // Bütün düymələrdən "active" sinifini çıxar
    tabButtons.forEach(btn => btn.classList.remove('active'));
    // Klikləniləni "active" et
    button.classList.add('active');

    // Bütün məzmunları gizlət
    tabContents.forEach(content => content.classList.remove('active'));
    // Uyğun məzmunu göstər
    document.getElementById(targetTab).classList.add('active');
  });
});