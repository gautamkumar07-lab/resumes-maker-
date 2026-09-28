/* =========================================
   NovaResume — Production JavaScript
   Pure JavaScript, no frameworks.
   ========================================= */

const STORAGE_KEY = "novaresume-v1";

const defaultData = {
  template: "classic",
  photo: "",
  fullName: "Alex Morgan",
  jobTitle: "Software Engineer",
  email: "alex@example.com",
  phone: "+91 98765 43210",
  location: "Jalandhar, Punjab, India",
  website: "https://example.com",
  summary: "Creative and detail-oriented software engineer with a strong foundation in web development and a passion for building accessible, high-performance digital experiences.",
  skills: "JavaScript, HTML, CSS, Git, Node.js, Communication",
  linkedin: "https://linkedin.com/in/alex",
  github: "https://github.com/alex",
  education: [
    { degree: "B.Tech in Computer Science", school: "City Group of Institutions", year: "2024 – 2028", desc: "Coursework in programming, data structures, databases and web technologies." }
  ],
  projects: [
    { title: "Real-Time Chat App", tech: "HTML • CSS • JavaScript • Socket.IO", date: "2026", desc: "Built a responsive real-time messaging experience with private room codes and file sharing." }
  ],
  experience: [
    { role: "Web Development Intern", company: "Tech Studio", date: "Jun 2026 – Aug 2026", desc: "Developed responsive interfaces, fixed UI issues and collaborated on frontend features." }
  ],
  certifications: [
    { name: "Web Development Fundamentals", issuer: "Online Academy", year: "2026" }
  ],
  achievements: [
    { text: "Built and published multiple frontend projects." },
    { text: "Participated in coding and technology competitions." }
  ],
  languages: [
    { name: "English", level: "Professional" },
    { name: "Hindi", level: "Native" }
  ]
};

let data = loadData();
let zoom = 1;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => $("#loader")?.classList.add("hide"), 450);
  bindStaticEvents();
  populateForm();
  renderAll();
});

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved ? { ...clone(defaultData), ...saved } : clone(defaultData);
  } catch {
    return clone(defaultData);
  }
}

function saveData(show = true) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  if (show) toast("Resume saved locally ✓");
}

function bindStaticEvents() {
  $("#resumeForm").addEventListener("input", handleInput);
  $("#resumeForm").addEventListener("change", handleInput);

  $("#photoInput").addEventListener("change", handlePhoto);
  $("#saveBtn").addEventListener("click", () => saveData(true));
  $("#downloadBtn").addEventListener("click", downloadPDF);
  $("#printBtn").addEventListener("click", printResume);

  $("#resetBtn").addEventListener("click", () => {
    if (!confirm("Reset the resume to the starter content?")) return;
    data = clone(defaultData);
    saveData(false);
    populateForm();
    renderAll();
    toast("Resume reset");
  });

  $("#themeToggle").addEventListener("click", () => {
    document.body.classList.toggle("light");
    localStorage.setItem("novaresume-theme", document.body.classList.contains("light") ? "light" : "dark");
  });

  if (localStorage.getItem("novaresume-theme") === "light") document.body.classList.add("light");

  $$(".template-card").forEach(btn => {
    btn.addEventListener("click", () => {
      data.template = btn.dataset.template;
      $$(".template-card").forEach(x => x.classList.toggle("active", x === btn));
      saveData(false);
      renderPreview();
    });
  });

  $$(".add-btn").forEach(btn => {
    btn.addEventListener("click", () => addItem(btn.dataset.add));
  });

  $("#zoomIn").addEventListener("click", () => setZoom(Math.min(1.15, zoom + .05)));
  $("#zoomOut").addEventListener("click", () => setZoom(Math.max(.55, zoom - .05)));
}

function populateForm() {
  const ids = ["fullName","jobTitle","email","phone","location","website","summary","skills","linkedin","github"];
  ids.forEach(id => {
    const el = $("#" + id);
    if (el) el.value = data[id] || "";
  });

  $$(".template-card").forEach(btn => btn.classList.toggle("active", btn.dataset.template === data.template));
  renderDynamicForms();

  const photoPreview = $("#photoPreview");
  photoPreview.innerHTML = data.photo ? `<img src="${escapeAttr(data.photo)}" alt="Profile">` : "👤";
}

function handleInput(e) {
  const id = e.target.id;
  if (id && Object.prototype.hasOwnProperty.call(data, id)) data[id] = e.target.value;
  renderPreview();
  updateProgress();
}

function handlePhoto(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    toast("Please select an image file.");
    return;
  }
  if (file.size > 2.5 * 1024 * 1024) {
    toast("Photo should be under 2.5 MB.");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    data.photo = reader.result;
    $("#photoPreview").innerHTML = `<img src="${escapeAttr(data.photo)}" alt="Profile">`;
    renderPreview();
    saveData(false);
    toast("Profile photo added");
  };
  reader.readAsDataURL(file);
}

function renderDynamicForms() {
  renderCollection("educationList", data.education, "education", [
    ["degree", "Degree / Program", "B.Tech in Computer Science"],
    ["school", "Institution", "University / College"],
    ["year", "Year", "2024 – 2028"],
    ["desc", "Details", "Relevant coursework, achievements or focus areas."]
  ]);
  renderCollection("projectsList", data.projects, "projects", [
    ["title", "Project Name", "Portfolio Website"],
    ["tech", "Technologies", "HTML • CSS • JavaScript"],
    ["date", "Date", "2026"],
    ["desc", "Description", "What you built, how you built it and the result."]
  ]);
  renderCollection("experienceList", data.experience, "experience", [
    ["role", "Role", "Frontend Developer"],
    ["company", "Company", "Company Name"],
    ["date", "Duration", "2026"],
    ["desc", "Description", "Responsibilities, contributions and measurable outcomes."]
  ]);
  renderCollection("certificationsList", data.certifications, "certifications", [
    ["name", "Certification", "JavaScript Fundamentals"],
    ["issuer", "Issuer", "Organization"],
    ["year", "Year", "2026"]
  ]);
  renderCollection("achievementsList", data.achievements, "achievements", [
    ["text", "Achievement", "Describe your achievement."]
  ]);
  renderCollection("languagesList", data.languages, "languages", [
    ["name", "Language", "English"],
    ["level", "Level", "Professional"]
  ]);
}

function renderCollection(containerId, items, type, fields) {
  const container = $("#" + containerId);
  if (!container) return;
  container.innerHTML = "";

  items.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "dynamic-card";

    const grid = document.createElement("div");
    grid.className = "field-grid";

    fields.forEach(([key, label, placeholder]) => {
      const labelEl = document.createElement("label");
      labelEl.textContent = label;
      const input = key === "desc" || key === "text" ? document.createElement("textarea") : document.createElement("input");
      if (key === "desc" || key === "text") input.rows = 3;
      input.placeholder = placeholder;
      input.value = item[key] || "";
      input.dataset.type = type;
      input.dataset.index = index;
      input.dataset.key = key;
      input.addEventListener("input", dynamicInput);
      labelEl.appendChild(input);
      grid.appendChild(labelEl);
    });

    const remove = document.createElement("button");
    remove.className = "remove-item";
    remove.type = "button";
    remove.title = "Delete";
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      data[type].splice(index, 1);
      renderDynamicForms();
      renderPreview();
      updateProgress();
      saveData(false);
    });

    card.appendChild(remove);
    card.appendChild(grid);
    container.appendChild(card);
  });
}

function dynamicInput(e) {
  const { type, index, key } = e.target.dataset;
  data[type][Number(index)][key] = e.target.value;
  renderPreview();
  updateProgress();
}

function addItem(type) {
  const blank = {
    education: { degree: "", school: "", year: "", desc: "" },
    projects: { title: "", tech: "", date: "", desc: "" },
    experience: { role: "", company: "", date: "", desc: "" },
    certifications: { name: "", issuer: "", year: "" },
    achievements: { text: "" },
    languages: { name: "", level: "" }
  };
  data[type].push(blank[type]);
  renderDynamicForms();
  renderPreview();
  updateProgress();

  const section = $(`[data-add="${type}"]`)?.closest("details");
  section?.setAttribute("open", "");
}

function renderAll() {
  renderDynamicForms();
  renderPreview();
  updateProgress();
}

function renderPreview() {
  const p = $("#resumePreview");
  if (!p) return;

  p.className = `resume-paper template-${data.template}`;

  const contact = [
    data.email && escapeHtml(data.email),
    data.phone && escapeHtml(data.phone),
    data.location && escapeHtml(data.location),
    data.website && `<a href="${safeUrl(data.website)}">${escapeHtml(shortUrl(data.website))}</a>`
  ].filter(Boolean).join("<span>•</span>");

  p.innerHTML = `
    <header class="resume-header">
      <div class="resume-photo">${data.photo ? `<img src="${escapeAttr(data.photo)}" alt="Profile photo">` : "👤"}</div>
      <div>
        <h1 class="resume-name">${escapeHtml(data.fullName || "Your Name")}</h1>
        <div class="resume-title">${escapeHtml(data.jobTitle || "Professional Title")}</div>
        <div class="contact-line">${contact || "Email • Phone • Location"}</div>
      </div>
    </header>

    ${data.summary ? section("Profile", `<p class="resume-summary">${escapeHtml(data.summary)}</p>`) : ""}

    <div class="resume-grid">
      <div>
        ${renderEducation()}
        ${renderExperience()}
        ${renderProjects()}
      </div>
      <div>
        ${renderSkills()}
        ${renderCertifications()}
        ${renderAchievements()}
        ${renderLanguages()}
        ${renderLinks()}
      </div>
    </div>
  `;

  p.style.transform = `scale(${zoom})`;
}

function section(title, content) {
  return `<section class="resume-section"><h3>${title}</h3>${content}</section>`;
}

function renderEducation() {
  const items = data.education.filter(hasAny);
  if (!items.length) return "";
  return section("Education", items.map(x => `
    <div class="resume-item">
      <div class="item-top"><div class="item-title">${escapeHtml(x.degree)}</div><div class="item-date">${escapeHtml(x.year)}</div></div>
      <div class="item-sub">${escapeHtml(x.school)}</div>
      ${x.desc ? `<div class="item-desc">${escapeHtml(x.desc)}</div>` : ""}
    </div>`).join(""));
}

function renderExperience() {
  const items = data.experience.filter(hasAny);
  if (!items.length) return "";
  return section("Experience", items.map(x => `
    <div class="resume-item">
      <div class="item-top"><div class="item-title">${escapeHtml(x.role)}</div><div class="item-date">${escapeHtml(x.date)}</div></div>
      <div class="item-sub">${escapeHtml(x.company)}</div>
      ${x.desc ? `<div class="item-desc">${escapeHtml(x.desc)}</div>` : ""}
    </div>`).join(""));
}

function renderProjects() {
  const items = data.projects.filter(hasAny);
  if (!items.length) return "";
  return section("Projects", items.map(x => `
    <div class="resume-item">
      <div class="item-top"><div class="item-title">${escapeHtml(x.title)}</div><div class="item-date">${escapeHtml(x.date)}</div></div>
      <div class="item-sub">${escapeHtml(x.tech)}</div>
      ${x.desc ? `<div class="item-desc">${escapeHtml(x.desc)}</div>` : ""}
    </div>`).join(""));
}

function renderSkills() {
  const skills = String(data.skills || "").split(",").map(s => s.trim()).filter(Boolean);
  if (!skills.length) return "";
  return section("Skills", `<div class="skills">${skills.map(s => `<span class="skill-pill">${escapeHtml(s)}</span>`).join("")}</div>`);
}

function renderCertifications() {
  const items = data.certifications.filter(hasAny);
  if (!items.length) return "";
  return section("Certifications", items.map(x => `
    <div class="resume-item"><div class="item-top"><div class="item-title">${escapeHtml(x.name)}</div><div class="item-date">${escapeHtml(x.year)}</div></div><div class="item-sub">${escapeHtml(x.issuer)}</div></div>
  `).join(""));
}

function renderAchievements() {
  const items = data.achievements.filter(hasAny);
  if (!items.length) return "";
  return section("Achievements", `<ul class="bullet-list">${items.map(x => `<li>${escapeHtml(x.text)}</li>`).join("")}</ul>`);
}

function renderLanguages() {
  const items = data.languages.filter(hasAny);
  if (!items.length) return "";
  return section("Languages", items.map(x => `
    <div class="resume-item"><div class="item-top"><div class="item-title">${escapeHtml(x.name)}</div><div class="item-date">${escapeHtml(x.level)}</div></div></div>
  `).join(""));
}

function renderLinks() {
  const links = [];
  if (data.linkedin) links.push(`<a href="${safeUrl(data.linkedin)}">LinkedIn</a>`);
  if (data.github) links.push(`<a href="${safeUrl(data.github)}">GitHub</a>`);
  if (!links.length) return "";
  return section("Online", `<div class="item-desc">${links.join(" • ")}</div>`);
}

function updateProgress() {
  const checks = [
    !!data.fullName, !!data.jobTitle, !!data.email, !!data.phone,
    !!data.location, !!data.summary, !!data.skills,
    data.education.some(hasAny), data.projects.some(hasAny),
    data.experience.some(hasAny), data.certifications.some(hasAny),
    data.achievements.some(hasAny), data.languages.some(hasAny)
  ];
  const percent = Math.round(checks.filter(Boolean).length / checks.length * 100);
  $("#progressBar").style.width = `${percent}%`;
  $("#progressText").textContent = `${percent}%`;
}

function setZoom(value) {
  zoom = value;
  $("#zoomValue").textContent = `${Math.round(zoom * 100)}%`;
  $("#resumePreview").style.transform = `scale(${zoom})`;
}

function downloadPDF() {
  const required = [];
  if (!data.fullName.trim()) required.push("Full Name");
  if (!data.email.trim()) required.push("Email");
  if (required.length) {
    toast(`Please add: ${required.join(", ")}`);
    return;
  }
  saveData(false);
  printResume();
}

function printResume() {
  // Browser print dialog supports "Save as PDF" without requiring a third-party PDF library.
  window.print();
}

function hasAny(obj) {
  return Object.values(obj || {}).some(v => String(v || "").trim());
}

function shortUrl(url) {
  return String(url).replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function safeUrl(url) {
  try {
    const u = new URL(url);
    return ["http:", "https:"].includes(u.protocol) ? u.href : "#";
  } catch { return "#"; }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[ch]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

let toastTimer;
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}
