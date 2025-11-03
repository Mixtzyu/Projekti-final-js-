
const darkModeToggle = document.getElementById('darkModeToggle');
const body = document.body;

darkModeToggle.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  darkModeToggle.textContent = body.classList.contains('dark-mode') ? '☀️' : '🌙';
});


const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('show');
});


const projectContainer = document.getElementById('projectContainer');

const projects = [
  {
    title: "Autosallon",
    description: "Projekti im i parë: një faqe autosalloni e ndërtuar vetëm me HTML dhe CSS. Shumë i thjeshtë por i mirë për fillim!",
    link: "#" // 
  },
  {
    title: "Portfolio",
    description: "Ky është projekti im i dytë, i ndërtuar me HTML, CSS dhe JavaScript. Ka dark mode, menu responsive dhe ngarkim dinamik të projekteve.",
    link: "#" 
  }
];

function loadProjects() {
  projectContainer.innerHTML = projects.map(project => `
    <div class="project-card">
      <h3>${project.title}</h3>
      <p>${project.description}</p>
      ${project.link !== "#" ? `<a href="${project.link}" target="_blank" class="btn">Shiko Projektin</a>` : ''}
    </div>
  `).join('');
}


window.onload = loadProjects;