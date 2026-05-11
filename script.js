const LOCAL_HOSTNAMES = new Set(["127.0.0.1", "localhost", ""]);
const urlParams = new URLSearchParams(window.location.search);
const initialStaticMode =
  urlParams.get("static") === "1" ||
  window.location.protocol === "file:" ||
  !LOCAL_HOSTNAMES.has(window.location.hostname);

let pdfjsLibPromise = null;

async function loadPdfJs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs").then((module) => {
      module.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs";
      return module;
    });
  }
  return pdfjsLibPromise;
}

const defaultSiteData = {
  profile: {
    name: "Your Name",
    role: "Researcher / Engineer / Student",
    photo: "assets/avatar-placeholder.svg",
    bio: [
      "Write a short paragraph introducing who you are, what you are currently doing, and the field you work in.",
      "Use the second paragraph to describe your background, collaborations, interests, or what kind of opportunities you are open to."
    ],
    links: [
      { label: "Email", url: "mailto:yourname@example.com" },
      { label: "Google Scholar", url: "#" },
      { label: "GitHub", url: "#" },
      { label: "LinkedIn", url: "#" }
    ]
  },
  navigation: [
    { label: "About Me", target: "#about" },
    { label: "What's New", target: "#news" },
    { label: "Research Topics", target: "#topics" },
    { label: "Featured", target: "#featured" },
    { label: "Experience", target: "#experience" },
    { label: "Services", target: "#services" }
  ],
  news: [
    { date: "2026.04", text: "Replace this line with your latest award, paper, internship, release, or milestone." },
    { date: "2026.03", text: "Add another recent update here so visitors can quickly see what is new." },
    { date: "2026.01", text: "You can keep this list short. Three to six recent items usually works well." }
  ],
  topics: ["Large Language Models", "AI Agents", "Multimodal Learning", "Human-AI Interaction"],
  featuredProjects: [
    {
      title: "Project One",
      venue: "Conference / Journal / Product",
      authors: "Your Name, Collaborator A, Collaborator B",
      summary: "Describe the problem, your contribution, and the core insight in 2-3 sentences.",
      links: [{ label: "Paper", url: "#" }, { label: "Code", url: "#" }, { label: "Demo", url: "#" }]
    }
  ],
  experience: [
    {
      organization: "University / Company Name",
      range: "2023 - Present",
      detail: "Current role, degree, advisor, lab, or team details go here."
    }
  ],
  services: [
    "Teaching Assistant: Course name, semester, and institution.",
    "Reviewer: Conference or journal list."
  ],
  misc: [
    "Add a personal hobby or interest so the page feels more human.",
    "Keep this section short and friendly."
  ],
  footer: "Copyright (c) 2026 Your Name"
};

const appState = {
  activeProfileId: null,
  profiles: [],
  translatedProfiles: {},
  siteData: structuredClone(defaultSiteData),
  manualPhotoDataUrl: "",
  sourceSiteData: structuredClone(defaultSiteData),
  translatedSiteData: null,
  currentLanguage: "en",
  profileSort: "pinned",
  staticMode: initialStaticMode,
  sourceRawText: "",
  sourceFileName: ""
};

/* const uiText = {
  en: {
    libraryKicker: "Profile Library",
    libraryHeading: "Select A Person",
    libraryCopy: "Choose someone from your saved profile database, or import a new PDF to create a profile page.",
    importNewProfile: "Import New Profile",
    searchPlaceholder: "Search by name, role, or topic",
    loadingProfiles: "Loading saved profiles ...",
    savedProfiles: (count) => `${count} saved profile${count === 1 ? "" : "s"}`,
    emptyProfiles: "No saved profiles yet. Import a PDF to create the first one.",
    deleteLabel: "Delete",
    backToPeople: "\u2190 Back To People",
    profileTemplate: "Personal Website Template",
    languageBusy: "Translating...",
    aboutKicker: "About Me",
    newsKicker: "What's New",
    newsHeading: "Recent Updates",
    topicsKicker: "Research Topics",
    topicsHeading: "Focus Areas",
    featuredKicker: "Featured",
    featuredHeading: "Selected Projects",
    experienceKicker: "Experience",
    experienceHeading: "Education & Work",
    servicesKicker: "Services",
    servicesHeading: "Teaching & Community",
    miscKicker: "Miscellaneous",
    miscHeading: "More About Me",
    importerKicker: "PDF Import",
    importerHeading: "Import From Resume PDF",
    importerCopy: "Upload a resume or profile PDF. The page will extract text, send it to the parsing API, store the person in MySQL, and refresh your profile library.",
    importerNote: "This page uses a thin local backend. Keep your API key on the server side with LLM_API_KEY, configure MySQL with the database variables, and the browser will only send extracted PDF text to the local parser endpoint.",
    choosePdf: "Choose PDF",
    replacePhoto: "Replace Photo",
    resetDefault: "Reset To Default",
    previewSummary: "Preview extracted text",
    toggleButton: "切换中文"
  },
  zh: {
    libraryKicker: "档案库",
    libraryHeading: "选择一个人",
    libraryCopy: "从已保存的档案数据库中选择一个人，或导入新的 PDF 创建个人主页。",
    importNewProfile: "导入新档案",
    searchPlaceholder: "按姓名、角色或主题搜索",
    loadingProfiles: "正在加载已保存档案 ...",
    savedProfiles: (count) => `${count} 个已保存档案`,
    emptyProfiles: "还没有保存的档案。导入 PDF 创建第一个档案。",
    deleteLabel: "删除",
    backToPeople: "\u2190 返回档案库",
    profileTemplate: "个人主页模板",
    languageBusy: "翻译中...",
    aboutKicker: "关于我",
    newsKicker: "最新动态",
    newsHeading: "最新更新",
    topicsKicker: "研究课题",
    topicsHeading: "重点领域",
    featuredKicker: "特色",
    featuredHeading: "代表项目",
    experienceKicker: "经历",
    experienceHeading: "教育与工作",
    servicesKicker: "服务",
    servicesHeading: "教学与社区",
    miscKicker: "其他",
    miscHeading: "更多关于我",
    importerKicker: "PDF 导入",
    importerHeading: "从简历 PDF 导入",
    importerCopy: "上传简历或个人资料 PDF。页面会提取文本，发送到解析接口，保存到 MySQL，并刷新档案库。",
    importerNote: "此页面使用本地轻量后端。请在服务端环境变量中配置 LLM_API_KEY 和 MySQL 连接信息，浏览器只会把提取出的 PDF 文本发送到本地解析端点。",
    choosePdf: "选择 PDF",
    replacePhoto: "替换照片",
    resetDefault: "恢复默认",
    previewSummary: "查看提取文本",
    toggleButton: "切换英文"
  }
};

}; */

const uiText = {
  en: {
    aboutKicker: "About Me",
    newsKicker: "What's New",
    newsHeading: "Recent Updates",
    topicsKicker: "Research Topics",
    topicsHeading: "Focus Areas",
    featuredKicker: "Featured",
    featuredHeading: "Selected Projects",
    experienceKicker: "Experience",
    experienceHeading: "Education & Work",
    servicesKicker: "Services",
    servicesHeading: "Teaching & Community",
    miscKicker: "Miscellaneous",
    miscHeading: "More About Me",
    importerKicker: "PDF Import",
    importerHeading: "Import From Resume PDF",
    importerCopy: "Upload a resume or profile PDF. The page will extract text, send it to the parsing API, store the person in MySQL, and refresh your profile library.",
    importerNoteHtml: "This page uses a thin local backend. Keep your API key on the server side with <code>LLM_API_KEY</code>, configure MySQL with the database variables, and the browser will only send extracted PDF text to the local parser endpoint.",
    choosePdf: "Choose PDF",
    replacePhoto: "Replace Photo",
    resetDefault: "Reset To Default",
    previewSummary: "Preview extracted text",
    toggleButton: "切换中文"
  },
  zh: {
    aboutKicker: "关于我",
    newsKicker: "最新动态",
    newsHeading: "最新更新",
    topicsKicker: "研究课题",
    topicsHeading: "重点领域",
    featuredKicker: "特色",
    featuredHeading: "代表项目",
    experienceKicker: "经历",
    experienceHeading: "教育与工作",
    servicesKicker: "服务",
    servicesHeading: "教学与社区",
    miscKicker: "其他",
    miscHeading: "更多关于我",
    importerKicker: "PDF 导入",
    importerHeading: "从简历 PDF 导入",
    importerCopy: "上传简历或个人资料 PDF。页面会提取文本，发送到解析接口，保存到 MySQL，并刷新档案库。",
    importerNoteHtml: "这个页面使用轻量本地后端。请把 API key 配在服务端环境变量 <code>LLM_API_KEY</code> 中，并配置 MySQL 连接信息；浏览器只会把提取后的 PDF 文本发送到本地解析端点。",
    choosePdf: "选择 PDF",
    replacePhoto: "替换照片",
    resetDefault: "恢复默认",
    previewSummary: "查看提取文本",
    toggleButton: "Switch to English"
  }
};

function cloneDefaultSiteData() {
  return structuredClone(defaultSiteData);
}

Object.assign(uiText.en, {
  libraryKicker: "Profile Library",
  libraryHeading: "Select A Person",
  libraryCopy: "Choose someone from your saved profile database, or import a new PDF to create a profile page.",
  importNewProfile: "Import New Profile",
  searchPlaceholder: "Search by name, role, or topic",
  sortLabel: "Sort",
  sortPinned: "Pinned first",
  sortNewest: "Newest updated",
  sortNameAsc: "Name A-Z",
  sortNameDesc: "Name Z-A",
  loadingProfiles: "Loading saved profiles ...",
  savedProfiles: (count) => `${count} saved profile${count === 1 ? "" : "s"}`,
  emptyProfiles: "No saved profiles yet. Import a PDF to create the first one.",
  deleteLabel: "Delete",
  pinLabel: "Pin",
  unpinLabel: "Unpin",
  pinnedLabel: "Pinned",
  pinSaved: "Pinned profile.",
  unpinSaved: "Unpinned profile.",
  pinBusy: "Updating pin ...",
  backToPeople: "\u2190 Back To People",
  profileTemplate: "Personal Website Template",
  languageBusy: "Translating...",
  toggleButton: "\u5207\u6362\u4e2d\u6587"
});

Object.assign(uiText.zh, {
  libraryKicker: "\u6863\u6848\u5e93",
  libraryHeading: "\u9009\u62e9\u4e00\u4e2a\u4eba",
  libraryCopy: "\u4ece\u5df2\u4fdd\u5b58\u7684\u6863\u6848\u6570\u636e\u5e93\u4e2d\u9009\u62e9\u4e00\u4e2a\u4eba\uff0c\u6216\u5bfc\u5165\u65b0\u7684 PDF \u521b\u5efa\u4e2a\u4eba\u4e3b\u9875\u3002",
  importNewProfile: "\u5bfc\u5165\u65b0\u6863\u6848",
  searchPlaceholder: "\u6309\u59d3\u540d\u3001\u89d2\u8272\u6216\u4e3b\u9898\u641c\u7d22",
  sortLabel: "\u6392\u5e8f",
  sortPinned: "\u7f6e\u9876\u4f18\u5148",
  sortNewest: "\u6700\u8fd1\u66f4\u65b0",
  sortNameAsc: "\u59d3\u540d A-Z",
  sortNameDesc: "\u59d3\u540d Z-A",
  loadingProfiles: "\u6b63\u5728\u52a0\u8f7d\u5df2\u4fdd\u5b58\u6863\u6848 ...",
  savedProfiles: (count) => `${count} \u4e2a\u5df2\u4fdd\u5b58\u6863\u6848`,
  emptyProfiles: "\u8fd8\u6ca1\u6709\u4fdd\u5b58\u7684\u6863\u6848\u3002\u5bfc\u5165 PDF \u521b\u5efa\u7b2c\u4e00\u4e2a\u6863\u6848\u3002",
  deleteLabel: "\u5220\u9664",
  pinLabel: "\u7f6e\u9876",
  unpinLabel: "\u53d6\u6d88\u7f6e\u9876",
  pinnedLabel: "\u5df2\u7f6e\u9876",
  pinSaved: "\u5df2\u7f6e\u9876\u6863\u6848\u3002",
  unpinSaved: "\u5df2\u53d6\u6d88\u7f6e\u9876\u3002",
  pinBusy: "\u6b63\u5728\u66f4\u65b0\u7f6e\u9876 ...",
  backToPeople: "\u2190 \u8fd4\u56de\u6863\u6848\u5e93",
  profileTemplate: "\u4e2a\u4eba\u4e3b\u9875\u6a21\u677f",
  languageBusy: "\u7ffb\u8bd1\u4e2d...",
  aboutKicker: "\u5173\u4e8e\u6211",
  newsKicker: "\u6700\u65b0\u52a8\u6001",
  newsHeading: "\u6700\u65b0\u66f4\u65b0",
  topicsKicker: "\u7814\u7a76\u8bfe\u9898",
  topicsHeading: "\u91cd\u70b9\u9886\u57df",
  featuredKicker: "\u7279\u8272",
  featuredHeading: "\u4ee3\u8868\u9879\u76ee",
  experienceKicker: "\u7ecf\u5386",
  experienceHeading: "\u6559\u80b2\u4e0e\u5de5\u4f5c",
  servicesKicker: "\u670d\u52a1",
  servicesHeading: "\u6559\u5b66\u4e0e\u793e\u533a",
  miscKicker: "\u5176\u4ed6",
  miscHeading: "\u66f4\u591a\u5173\u4e8e\u6211",
  importerKicker: "PDF \u5bfc\u5165",
  importerHeading: "\u4ece\u7b80\u5386 PDF \u5bfc\u5165",
  importerCopy: "\u4e0a\u4f20\u7b80\u5386\u6216\u4e2a\u4eba\u8d44\u6599 PDF\u3002\u9875\u9762\u4f1a\u63d0\u53d6\u6587\u672c\uff0c\u53d1\u9001\u5230\u89e3\u6790\u63a5\u53e3\uff0c\u4fdd\u5b58\u5230 MySQL\uff0c\u5e76\u5237\u65b0\u6863\u6848\u5e93\u3002",
  importerNoteHtml: "\u8fd9\u4e2a\u9875\u9762\u4f7f\u7528\u8f7b\u91cf\u672c\u5730\u540e\u7aef\u3002\u8bf7\u628a API key \u914d\u5728\u670d\u52a1\u7aef\u73af\u5883\u53d8\u91cf <code>LLM_API_KEY</code> \u4e2d\uff0c\u5e76\u914d\u7f6e MySQL \u8fde\u63a5\u4fe1\u606f\uff1b\u6d4f\u89c8\u5668\u53ea\u4f1a\u628a\u63d0\u53d6\u540e\u7684 PDF \u6587\u672c\u53d1\u9001\u5230\u672c\u5730\u89e3\u6790\u7aef\u70b9\u3002",
  choosePdf: "\u9009\u62e9 PDF",
  replacePhoto: "\u66ff\u6362\u7167\u7247",
  resetDefault: "\u6062\u590d\u9ed8\u8ba4",
  previewSummary: "\u67e5\u770b\u63d0\u53d6\u6587\u672c",
  toggleButton: "Switch to English"
});

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeExperienceItems(experienceItems) {
  return (experienceItems || [])
    .map((item) => {
      const detail = (item?.detail || "").trim();
      const organization = (item?.organization || "").trim();
      const range = (item?.range || "").trim();

      if (!detail && !organization) {
        return null;
      }

      let normalizedOrganization = organization;
      if (!normalizedOrganization) {
        if (/phd|doctor/i.test(detail)) {
          normalizedOrganization = "Doctoral Study";
        } else if (/master/i.test(detail)) {
          normalizedOrganization = "Master's Study";
        } else if (/bachelor/i.test(detail)) {
          normalizedOrganization = "Bachelor's Study";
        } else if (/professor|researcher|engineer|assistant|lecturer|intern/i.test(detail)) {
          normalizedOrganization = "Professional Experience";
        } else {
          normalizedOrganization = "Imported Experience";
        }
      }

      return {
        organization: normalizedOrganization,
        range: range || "Imported",
        detail: detail || normalizedOrganization
      };
    })
    .filter(Boolean);
}

function buildImportedSiteData(parsed, options = {}) {
  const sourceRawText = options.sourceRawText ?? appState.sourceRawText;
  const sourceFileName = options.sourceFileName ?? appState.sourceFileName;
  const manualPhotoDataUrl = options.manualPhotoDataUrl ?? appState.manualPhotoDataUrl;
  const importedName = parsed.profile?.name?.trim() || defaultSiteData.profile.name;
  const importedOriginalName =
    parsed.profile?.originalName?.trim() ||
    inferChineseNameFromSourceText(sourceRawText) ||
    inferChineseNameFromSourceName(parsed.profile?.sourceName || sourceFileName);
  const importedLinks = (parsed.profile?.links || []).filter((item) => item?.label && item?.url);
  const importedBio = (parsed.profile?.bio || []).filter(Boolean);
  const importedNews = (parsed.news || []).filter((item) => item?.date && item?.text);
  const importedTopics = (parsed.topics || []).filter(Boolean);
  const importedProjects = (parsed.featuredProjects || []).filter((item) => item?.title && item?.summary);
  const importedExperience = normalizeExperienceItems(parsed.experience);
  const importedServices = (parsed.services || []).filter(Boolean);
  const importedMisc = (parsed.misc || []).filter(Boolean);

  return {
    ...cloneDefaultSiteData(),
    profile: {
      ...cloneDefaultSiteData().profile,
      name: importedName,
      originalName: importedOriginalName,
      sourceName: parsed.profile?.sourceName || sourceFileName || "",
      gender: parsed.profile?.gender || parsed.profile?.sex || "",
      role: parsed.profile?.role?.trim() || defaultSiteData.profile.role,
      bio: importedBio.length > 0 ? importedBio : defaultSiteData.profile.bio,
      links: importedLinks.length > 0 ? importedLinks : cloneDefaultSiteData().profile.links,
      photo: manualPhotoDataUrl || parsed.profile?.photo?.trim() || cloneDefaultSiteData().profile.photo
    },
    news: importedNews.length > 0 ? importedNews : defaultSiteData.news,
    topics: importedTopics.length > 0 ? importedTopics : defaultSiteData.topics,
    featuredProjects: importedProjects.length > 0 ? importedProjects : defaultSiteData.featuredProjects,
    experience: importedExperience.length > 0 ? importedExperience : defaultSiteData.experience,
    services: importedServices.length > 0 ? importedServices : defaultSiteData.services,
    misc: importedMisc.length > 0 ? importedMisc : defaultSiteData.misc,
    footer: `Copyright (c) 2026 ${importedName}`
  };
}

function inferChineseNameFromSourceText(rawText = "") {
  const normalized = String(rawText).normalize("NFKC").replace(/\s+/g, "");
  if (!normalized) {
    return "";
  }

  const patterns = [
    /(?:姓名|Name)[:：]([\u4e00-\u9fff]{2,4}?)(?=(?:意向|所在|性别|年龄|邮箱|电话|手机|求职|PERSONAL|教育|实习|项目|获奖|技能|自我评价|$))/i,
    /(?:姓名|Name)[:：]([\u4e00-\u9fff]{2,4})/i
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return "";
}

function inferChineseNameFromSourceName(sourceName = "") {
  const stem = String(sourceName).replace(/^.*[\\/]/, "").replace(/\.[^.]+$/, "").trim();
  const patterns = [
    /([\u4e00-\u9fff]{2,4})(?:个人简历|简历|履历|CV|cv|Resume|resume)/,
    /^([\u4e00-\u9fff]{2,4})/
  ];

  for (const pattern of patterns) {
    const match = stem.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return "";
}

function resolveDisplayNameForLanguage() {
  if (appState.currentLanguage !== "zh") {
    return appState.sourceSiteData?.profile?.name || appState.siteData?.profile?.name || "";
  }

  return (
    appState.siteData?.profile?.originalName ||
    appState.sourceSiteData?.profile?.originalName ||
    inferChineseNameFromSourceText(appState.sourceRawText) ||
    inferChineseNameFromSourceName(appState.sourceFileName) ||
    inferChineseNameFromSourceName(appState.siteData?.profile?.sourceName) ||
    inferChineseNameFromSourceName(appState.sourceSiteData?.profile?.sourceName) ||
    appState.siteData?.profile?.name ||
    appState.sourceSiteData?.profile?.name ||
    ""
  );
}

function mergeTranslatedSiteData(original, translated) {
  const safeOriginal = original || cloneDefaultSiteData();
  const safeTranslated = translated || {};
  const originalProfile = safeOriginal.profile || {};
  const translatedProfile = safeTranslated.profile || {};

  return {
    ...safeOriginal,
    ...safeTranslated,
    profile: {
      ...originalProfile,
      ...translatedProfile,
      name: translatedProfile.name || originalProfile.name,
      role: translatedProfile.role || originalProfile.role,
      photo: originalProfile.photo || translatedProfile.photo || cloneDefaultSiteData().profile.photo,
      bio: Array.isArray(translatedProfile.bio) && translatedProfile.bio.length
        ? translatedProfile.bio
        : originalProfile.bio,
      links: (Array.isArray(translatedProfile.links) ? translatedProfile.links : originalProfile.links).map((link, index) => ({
        ...(originalProfile.links?.[index] || {}),
        ...(link || {}),
        url: originalProfile.links?.[index]?.url || link?.url || "#"
      }))
    },
    navigation: (Array.isArray(safeTranslated.navigation) ? safeTranslated.navigation : safeOriginal.navigation).map((item, index) => ({
      ...(safeOriginal.navigation?.[index] || {}),
      ...(item || {}),
      target: safeOriginal.navigation?.[index]?.target || item?.target || "#about"
    })),
    news: Array.isArray(safeTranslated.news) && safeTranslated.news.length ? safeTranslated.news : safeOriginal.news,
    topics: Array.isArray(safeTranslated.topics) && safeTranslated.topics.length ? safeTranslated.topics : safeOriginal.topics,
    featuredProjects: Array.isArray(safeTranslated.featuredProjects) && safeTranslated.featuredProjects.length
      ? safeTranslated.featuredProjects.map((project, index) => ({
        ...(safeOriginal.featuredProjects?.[index] || {}),
        ...(project || {}),
        links: (Array.isArray(project?.links) ? project.links : safeOriginal.featuredProjects?.[index]?.links || []).map((link, linkIndex) => ({
          ...(safeOriginal.featuredProjects?.[index]?.links?.[linkIndex] || {}),
          ...(link || {}),
          url: safeOriginal.featuredProjects?.[index]?.links?.[linkIndex]?.url || link?.url || "#"
        }))
      }))
      : safeOriginal.featuredProjects,
    experience: Array.isArray(safeTranslated.experience) && safeTranslated.experience.length ? safeTranslated.experience : safeOriginal.experience,
    services: Array.isArray(safeTranslated.services) && safeTranslated.services.length ? safeTranslated.services : safeOriginal.services,
    misc: Array.isArray(safeTranslated.misc) && safeTranslated.misc.length ? safeTranslated.misc : safeOriginal.misc,
    footer: safeTranslated.footer || safeOriginal.footer
  };
}

function fillProfile() {
  const siteData = appState.siteData;
  const displayName = resolveDisplayNameForLanguage() || siteData.profile.name;
  document.getElementById("person-name").textContent = displayName;
  document.getElementById("person-role").textContent = siteData.profile.role;
  document.getElementById("person-photo").src = siteData.profile.photo;
  document.getElementById("person-photo").alt = `${displayName} portrait`;

  document.getElementById("bio").innerHTML = siteData.profile.bio
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
    .join("");

  document.getElementById("social-links").innerHTML = siteData.profile.links
    .map((item) => `<a href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.label)}</a>`)
    .join("");
}

function fillNavigation() {
  document.getElementById("top-nav").innerHTML = appState.siteData.navigation
    .map((item) => `<a href="${escapeHtml(item.target)}">${escapeHtml(item.label)}</a>`)
    .join("");
}

function fillNews() {
  document.getElementById("news-list").innerHTML = appState.siteData.news
    .map((item) => `<li><span class="news-date">${escapeHtml(item.date)}</span>${escapeHtml(item.text)}</li>`)
    .join("");
}

function fillTopics() {
  document.getElementById("topic-list").innerHTML = appState.siteData.topics
    .map((topic) => `<div class="topic-pill">${escapeHtml(topic)}</div>`)
    .join("");
}

function fillProjects() {
  document.getElementById("project-grid").innerHTML = appState.siteData.featuredProjects
    .map((project) => `
      <article class="project-card">
        <h3>${escapeHtml(project.title)}</h3>
        <div class="project-meta">${escapeHtml(project.venue || "")}</div>
        <p>${escapeHtml(project.authors || "")}</p>
        <p>${escapeHtml(project.summary || "")}</p>
        <div class="link-row">
          ${(project.links || [])
            .map((link) => `<a href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`)
            .join("")}
        </div>
      </article>
    `)
    .join("");
}

function fillExperience() {
  document.getElementById("timeline").innerHTML = appState.siteData.experience
    .map((item) => `
      <article class="timeline-item">
        <h3>${escapeHtml(item.organization)}</h3>
        <p class="timeline-range">${escapeHtml(item.range)}</p>
        <p>${escapeHtml(item.detail)}</p>
      </article>
    `)
    .join("");
}

function fillServices() {
  document.getElementById("services-list").innerHTML = appState.siteData.services
    .map((item) => `<div class="service-item"><strong>&bull;</strong> ${escapeHtml(item)}</div>`)
    .join("");
  document.getElementById("misc-list").innerHTML = appState.siteData.misc
    .map((item) => `<li>${escapeHtml(item)}</li>`)
    .join("");
}

function fillFooter() {
  const displayName = resolveDisplayNameForLanguage() || appState.siteData.profile.name;
  const footerText = appState.siteData.footer || "";
  const sourceName = appState.sourceSiteData?.profile?.name || appState.siteData.profile.name;
  const normalizedFooter = sourceName ? footerText.replace(sourceName, displayName) : footerText;
  document.getElementById("footer-text").textContent = normalizedFooter;
  document.title = `${displayName} | Homepage`;
}

function fillUiText() {
  const copy = uiText[appState.currentLanguage];
  document.getElementById("library-kicker").textContent = copy.libraryKicker;
  document.getElementById("library-heading").textContent = copy.libraryHeading;
  document.getElementById("library-copy").textContent = copy.libraryCopy;
  document.getElementById("create-profile-button").textContent = copy.importNewProfile;
  document.getElementById("global-language-toggle-button").textContent = copy.toggleButton;
  document.getElementById("profile-search").placeholder = copy.searchPlaceholder;
  document.getElementById("profile-sort-label").textContent = copy.sortLabel;
  document.getElementById("profile-sort").innerHTML = [
    ["pinned", copy.sortPinned],
    ["newest", copy.sortNewest],
    ["name-asc", copy.sortNameAsc],
    ["name-desc", copy.sortNameDesc]
  ].map(([value, label]) => `<option value="${value}">${escapeHtml(label)}</option>`).join("");
  document.getElementById("profile-sort").value = appState.profileSort;
  document.getElementById("back-to-library").textContent = copy.backToPeople;
  document.querySelector(".sidebar-profile .eyebrow").textContent = copy.profileTemplate;
  document.getElementById("about-kicker").textContent = copy.aboutKicker;
  document.getElementById("news-kicker").textContent = copy.newsKicker;
  document.getElementById("news-heading").textContent = copy.newsHeading;
  document.getElementById("topics-kicker").textContent = copy.topicsKicker;
  document.getElementById("topics-heading").textContent = copy.topicsHeading;
  document.getElementById("featured-kicker").textContent = copy.featuredKicker;
  document.getElementById("featured-heading").textContent = copy.featuredHeading;
  document.getElementById("experience-kicker").textContent = copy.experienceKicker;
  document.getElementById("experience-heading").textContent = copy.experienceHeading;
  document.getElementById("services-kicker").textContent = copy.servicesKicker;
  document.getElementById("services-heading").textContent = copy.servicesHeading;
  document.getElementById("misc-kicker").textContent = copy.miscKicker;
  document.getElementById("misc-heading").textContent = copy.miscHeading;
  document.getElementById("importer-kicker").textContent = copy.importerKicker;
  document.getElementById("importer-heading").textContent = copy.importerHeading;
  document.getElementById("importer-copy").textContent = copy.importerCopy;
  document.getElementById("importer-note").innerHTML = copy.importerNoteHtml;
  document.getElementById("pdf-input-label").textContent = copy.choosePdf;
  document.getElementById("photo-input-label").textContent = copy.replacePhoto;
  document.getElementById("reset-button").textContent = copy.resetDefault;
  document.getElementById("preview-summary").textContent = copy.previewSummary;
}

function syncStaticModeControls() {
  document.body.classList.toggle("static-mode", appState.staticMode);
  document.getElementById("create-profile-button").classList.toggle("hidden", appState.staticMode);
}

function syncTranslationState() {
  appState.sourceSiteData = structuredClone(appState.siteData);
  appState.translatedSiteData = null;
}

async function translateCurrentSite() {
  if (appState.translatedSiteData) {
    return appState.translatedSiteData;
  }

  if (appState.staticMode) {
    return appState.sourceSiteData;
  }

  const payload = await fetchJson("/api/translate-site", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      profile_id: appState.activeProfileId,
      site_data: appState.sourceSiteData,
      source_raw_text: appState.sourceRawText,
      translation_source_name: appState.sourceFileName,
      target_language: "Simplified Chinese"
    })
  });

  appState.translatedSiteData = mergeTranslatedSiteData(appState.sourceSiteData, payload.site_data);
  return appState.translatedSiteData;
}

async function applyCurrentLanguageToActiveProfile() {
  if (appState.currentLanguage === "zh" && appState.activeProfileId) {
    appState.siteData = await translateCurrentSite();
  } else {
    appState.siteData = structuredClone(appState.sourceSiteData);
  }
}

async function translateProfileForLibrary(profile) {
  if (appState.translatedProfiles[profile.id]) {
    return appState.translatedProfiles[profile.id];
  }

  if (appState.staticMode) {
    cacheProfileTranslationSummary(profile, profile.translations?.zh);
    return appState.translatedProfiles[profile.id] || profile;
  }

  const detailPayload = await fetchJson(`/api/profiles/${encodeURIComponent(profile.id)}`);
  const record = detailPayload.profile;
  const sourceName = record.data?.profile?.sourceName || record.id || "";
  const sourceData = buildImportedSiteData(record.data, {
    sourceRawText: record.raw_text || "",
    sourceFileName: sourceName,
    manualPhotoDataUrl: ""
  });
  const translatedPayload = await fetchJson("/api/translate-site", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      profile_id: profile.id,
      site_data: sourceData,
      source_raw_text: record.raw_text || "",
      translation_source_name: sourceName,
      target_language: "Simplified Chinese"
    })
  });
  const translatedSite = mergeTranslatedSiteData(sourceData, translatedPayload.site_data);
  const displayName =
    translatedSite.profile?.originalName ||
    translatedSite.profile?.name ||
    profile.name;
  const translatedProfile = {
    ...profile,
    name: displayName,
    role: translatedSite.profile?.role || profile.role,
    summary: translatedSite.profile?.bio?.[0] || profile.summary,
    topics: translatedSite.topics?.length ? translatedSite.topics : profile.topics
  };
  appState.translatedProfiles[profile.id] = translatedProfile;
  return translatedProfile;
}

async function translateLibraryProfiles() {
  if (!appState.profiles.length) {
    return;
  }
  setLibraryStatus("正在翻译档案库 ...");
  for (const profile of appState.profiles) {
    try {
      await translateProfileForLibrary(profile);
    } catch {
      appState.translatedProfiles[profile.id] = appState.translatedProfiles[profile.id] || profile;
    }
  }
  renderCurrentProfileList();
  setLibraryStatus(uiText.zh.savedProfiles(appState.profiles.length));
}

async function toggleLanguage() {
  const button = document.getElementById("global-language-toggle-button");
  const previousLabel = button.textContent;
  button.disabled = true;
  const previousLanguage = appState.currentLanguage;
  const previousSiteData = structuredClone(appState.siteData);

  try {
    if (appState.currentLanguage === "en") {
      button.textContent = uiText.en.languageBusy;
      appState.currentLanguage = "zh";
      await applyCurrentLanguageToActiveProfile();
      await translateLibraryProfiles();
    } else {
      appState.currentLanguage = "en";
      appState.siteData = structuredClone(appState.sourceSiteData);
      renderCurrentProfileList();
      setLibraryStatus(uiText.en.savedProfiles(appState.profiles.length));
    }
    renderSite();
  } catch (error) {
    appState.currentLanguage = previousLanguage;
    appState.siteData = previousSiteData;
    setImporterStatus(error.message || "Language switch failed.");
    button.textContent = previousLabel;
    renderSite();
  } finally {
    button.disabled = false;
  }
}

function renderSite() {
  fillProfile();
  fillNavigation();
  fillNews();
  fillTopics();
  fillProjects();
  fillExperience();
  fillServices();
  fillFooter();
  fillUiText();
}

function setView(mode) {
  document.getElementById("library-view").classList.toggle("hidden", mode !== "library");
  document.getElementById("profile-view").classList.toggle("hidden", mode !== "profile");
  updateImporterVisibility();
}

function updateImporterVisibility() {
  const importer = document.getElementById("importer");
  importer.classList.toggle("hidden", appState.staticMode || Boolean(appState.activeProfileId));
}

function setLibraryStatus(message) {
  document.getElementById("library-status").textContent = message;
}

function setImporterStatus(message) {
  document.getElementById("importer-status").textContent = message;
}

function setPreviewText(text) {
  document.getElementById("pdf-preview").textContent = text;
}

function getProfileCardData(profile) {
  if (appState.currentLanguage !== "zh") {
    return profile;
  }
  return appState.translatedProfiles[profile.id] || profile;
}

function summarizeTranslationEntry(entry) {
  if (!entry) {
    return null;
  }

  if (!entry.site_data) {
    return entry;
  }

  const siteData = entry.site_data || {};
  const profile = siteData.profile || {};
  return {
    name: profile.originalName || profile.name || "",
    role: profile.role || "",
    summary: ((profile.bio || [""]).slice(0, 1) || [""])[0],
    topics: siteData.topics || []
  };
}

function cacheProfileTranslationSummary(profile, translatedSummary) {
  const summary = summarizeTranslationEntry(translatedSummary);
  if (!profile?.id || !summary) {
    return;
  }
  appState.translatedProfiles[profile.id] = {
    ...profile,
    name: summary.name || profile.name,
    role: summary.role || profile.role,
    summary: summary.summary || profile.summary,
    topics: summary.topics?.length ? summary.topics : profile.topics
  };
}

function cacheProfileTranslationSummaries(profiles = appState.profiles) {
  profiles.forEach((profile) => {
    cacheProfileTranslationSummary(profile, profile.translations?.zh);
  });
}

function profileTimeValue(value) {
  if (!value) {
    return 0;
  }
  const normalized = String(value).replace(" ", "T");
  const parsed = Date.parse(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function comparePinned(a, b) {
  const pinnedDifference = Number(Boolean(b.is_pinned)) - Number(Boolean(a.is_pinned));
  if (pinnedDifference) {
    return pinnedDifference;
  }
  return profileTimeValue(b.pinned_at) - profileTimeValue(a.pinned_at);
}

function compareProfileNames(a, b, direction = 1) {
  const profileA = getProfileCardData(a);
  const profileB = getProfileCardData(b);
  const nameA = profileA.name || a.name || "";
  const nameB = profileB.name || b.name || "";
  return direction * nameA.localeCompare(nameB, appState.currentLanguage === "zh" ? "zh-Hans-CN" : "en", {
    numeric: true,
    sensitivity: "base"
  });
}

function sortProfiles(items) {
  return [...items].sort((a, b) => {
    if (appState.profileSort === "newest") {
      return profileTimeValue(b.updated_at) - profileTimeValue(a.updated_at);
    }
    if (appState.profileSort === "name-asc") {
      return compareProfileNames(a, b, 1);
    }
    if (appState.profileSort === "name-desc") {
      return compareProfileNames(a, b, -1);
    }

    return (
      comparePinned(a, b) ||
      profileTimeValue(b.updated_at) - profileTimeValue(a.updated_at) ||
      compareProfileNames(a, b, 1)
    );
  });
}

function getVisibleProfiles() {
  const query = document.getElementById("profile-search").value.trim().toLowerCase();
  const filtered = query
    ? appState.profiles.filter((profile) => {
      const displayProfile = getProfileCardData(profile);
      const haystack = [
        profile.name,
        profile.role,
        profile.summary,
        ...(profile.topics || []),
        displayProfile.name,
        displayProfile.role,
        displayProfile.summary,
        ...(displayProfile.topics || [])
      ].join(" ").toLowerCase();
      return haystack.includes(query);
    })
    : appState.profiles;

  return sortProfiles(filtered);
}

function renderCurrentProfileList() {
  renderProfileList(getVisibleProfiles());
}

function profileCardMarkup(profile) {
  const displayProfile = getProfileCardData(profile);
  const topics = (displayProfile.topics || []).slice(0, 4);
  const summary = displayProfile.summary || "";
  const copy = uiText[appState.currentLanguage];
  const editControls = appState.staticMode
    ? ""
    : `
          <button type="button" class="card-pin-button${profile.is_pinned ? " is-active" : ""}" data-pin-profile-id="${escapeHtml(profile.id)}" data-pinned="${profile.is_pinned ? "true" : "false"}">${escapeHtml(profile.is_pinned ? copy.unpinLabel : copy.pinLabel)}</button>
          <button type="button" class="card-delete-button" data-delete-profile-id="${escapeHtml(profile.id)}">${escapeHtml(copy.deleteLabel)}</button>
        `;
  return `
    <article class="profile-card" data-profile-id="${escapeHtml(profile.id)}">
      <div class="profile-card-top">
        <div>
          <h3>${escapeHtml(displayProfile.name || profile.name)}</h3>
          <div class="profile-role">${escapeHtml(displayProfile.role || "")}</div>
        </div>
        <div class="profile-card-actions">
          <div class="profile-meta">${escapeHtml(profile.updated_at || "")}</div>
          ${profile.is_pinned ? `<span class="profile-pin-badge">${escapeHtml(copy.pinnedLabel)}</span>` : ""}
          ${editControls}
        </div>
      </div>
      <div class="profile-meta">${escapeHtml(summary)}</div>
      <div class="profile-topics">
        ${topics.map((topic) => `<span class="profile-topic-chip">${escapeHtml(topic)}</span>`).join("")}
      </div>
    </article>
  `;
}

function renderProfileList(items = appState.profiles) {
  const listRoot = document.getElementById("profile-list");
  if (!items.length) {
    listRoot.innerHTML = `<div class="profile-list-empty">${escapeHtml(uiText[appState.currentLanguage].emptyProfiles)}</div>`;
    return;
  }
  listRoot.innerHTML = items.map(profileCardMarkup).join("");
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text || "Server returned invalid JSON.");
  }
  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }
  return payload;
}

async function loadStaticProfileList() {
  const payload = await fetchJson("data/profiles.json");
  appState.staticMode = true;
  syncStaticModeControls();
  appState.profiles = payload.profiles || [];
  cacheProfileTranslationSummaries(appState.profiles);
  renderCurrentProfileList();
  if (appState.currentLanguage === "zh") {
    await translateLibraryProfiles();
  } else {
    setLibraryStatus(uiText.en.savedProfiles(appState.profiles.length));
  }
}

async function loadProfileList() {
  setLibraryStatus(uiText[appState.currentLanguage].loadingProfiles);
  try {
    if (appState.staticMode) {
      await loadStaticProfileList();
      return;
    }

    const payload = await fetchJson("/api/profiles");
    appState.profiles = payload.profiles || [];
    cacheProfileTranslationSummaries(appState.profiles);
    renderCurrentProfileList();
    if (appState.currentLanguage === "zh") {
      await translateLibraryProfiles();
    } else {
      setLibraryStatus(uiText.en.savedProfiles(appState.profiles.length));
    }
  } catch (error) {
    try {
      await loadStaticProfileList();
    } catch {
      renderProfileList([]);
      setLibraryStatus(error.message || "Failed to load profiles.");
    }
  }
}

async function loadProfileDetail(profileId) {
  try {
    const payload = appState.staticMode
      ? { profile: appState.profiles.find((profile) => profile.id === profileId) }
      : await fetchJson(`/api/profiles/${encodeURIComponent(profileId)}`);

    if (!payload.profile) {
      throw new Error("Profile not found.");
    }

    appState.activeProfileId = payload.profile.id;
    appState.sourceRawText = payload.profile.raw_text || "";
    appState.sourceFileName = payload.profile.data?.profile?.sourceName || payload.profile.id || "";
    appState.siteData = buildImportedSiteData(payload.profile.data);
    syncTranslationState();
    if (payload.profile.translations?.zh?.site_data) {
      appState.translatedSiteData = mergeTranslatedSiteData(appState.sourceSiteData, payload.profile.translations.zh.site_data);
    }
    await applyCurrentLanguageToActiveProfile();
    renderSite();
    setView("profile");
  } catch (error) {
    setLibraryStatus(error.message || "Failed to load the selected profile.");
    setView("library");
  }
}

async function updateProfilePin(profileId, pinned) {
  if (!profileId) {
    return;
  }
  if (appState.staticMode) {
    return;
  }

  const copy = uiText[appState.currentLanguage];
  setLibraryStatus(copy.pinBusy);

  try {
    const payload = await fetchJson(`/api/profiles/${encodeURIComponent(profileId)}/pin`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned })
    });
    const updated = payload.profile || {};
    appState.profiles = appState.profiles.map((profile) => (
      profile.id === profileId
        ? {
          ...profile,
          is_pinned: Boolean(updated.is_pinned),
          pinned_at: updated.pinned_at || "",
          updated_at: updated.updated_at || profile.updated_at
        }
        : profile
    ));
    renderCurrentProfileList();
    setLibraryStatus(pinned ? copy.pinSaved : copy.unpinSaved);
  } catch (error) {
    setLibraryStatus(error.message || "Failed to update pin.");
  }
}

async function deleteProfile(profileId = appState.activeProfileId) {
  if (!profileId) {
    return;
  }
  if (appState.staticMode) {
    return;
  }

  const target = appState.profiles.find((item) => item.id === profileId);
  const displayTarget = target ? getProfileCardData(target) : null;
  const name = displayTarget?.name || target?.name || (appState.currentLanguage === "zh" ? "这个档案" : "this profile");
  const confirmed = window.confirm(
    appState.currentLanguage === "zh"
      ? `删除 ${name}？此操作无法撤销。`
      : `Delete ${name}? This cannot be undone.`
  );
  if (!confirmed) {
    return;
  }

  try {
    await fetchJson(`/api/profiles/${encodeURIComponent(profileId)}`, { method: "DELETE" });
    if (appState.activeProfileId === profileId) {
      appState.activeProfileId = null;
      appState.siteData = cloneDefaultSiteData();
      syncTranslationState();
      renderSite();
      setView("library");
    }
      await loadProfileList();
    setLibraryStatus(appState.currentLanguage === "zh" ? `已删除 ${name}。` : `Deleted ${name}.`);
  } catch (error) {
    setLibraryStatus(error.message || "Failed to delete the profile.");
  }
}

function filterProfiles() {
  renderCurrentProfileList();
}

async function extractPdfText(file) {
  const pdfjsLib = await loadPdfJs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(" "));
  }

  return pages.join("\n\n");
}

async function fileToBase64(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function maskTextRegions(context, textContent, viewport, pdfjsLib) {
  context.save();
  context.fillStyle = "#ffffff";
  (textContent.items || []).forEach((item) => {
    const transform = pdfjsLib.Util.transform(viewport.transform, item.transform);
    const x = transform[4];
    const y = transform[5];
    const width = Math.max(12, (item.width || 0) * viewport.scale * 1.05);
    const height = Math.max(12, Math.abs(transform[3]) * 1.25);
    context.fillRect(x - 3, y - height, width + 6, height + 8);
  });
  context.restore();
}

function detectNonWhiteBounds(imageData, width, height) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const r = imageData[index];
      const g = imageData[index + 1];
      const b = imageData[index + 2];
      const a = imageData[index + 3];
      const isForeground = a > 20 && (r < 245 || g < 245 || b < 245);

      if (isForeground) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX <= minX || maxY <= minY) {
    return null;
  }

  return { minX, minY, maxX, maxY };
}

function scorePortraitBounds(bounds) {
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  if (width <= 0 || height <= 0) {
    return -1;
  }

  const area = width * height;
  const aspect = height / width;
  const aspectPenalty = Math.abs(aspect - 1.25);
  return area - aspectPenalty * 5000;
}

function findLargestForegroundComponent(imageData, width, height) {
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const r = imageData[index];
      const g = imageData[index + 1];
      const b = imageData[index + 2];
      const a = imageData[index + 3];
      if (a > 20 && (r < 245 || g < 245 || b < 245)) {
        mask[y * width + x] = 1;
      }
    }
  }

  const visited = new Uint8Array(width * height);
  const queueX = new Int32Array(width * height);
  const queueY = new Int32Array(width * height);
  let best = null;

  for (let startY = 0; startY < height; startY += 1) {
    for (let startX = 0; startX < width; startX += 1) {
      const startIndex = startY * width + startX;
      if (!mask[startIndex] || visited[startIndex]) {
        continue;
      }

      let head = 0;
      let tail = 0;
      visited[startIndex] = 1;
      queueX[tail] = startX;
      queueY[tail] = startY;
      tail += 1;

      let minX = startX;
      let minY = startY;
      let maxX = startX;
      let maxY = startY;
      let area = 0;

      while (head < tail) {
        const x = queueX[head];
        const y = queueY[head];
        head += 1;
        area += 1;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);

        const neighbors = [
          [x + 1, y],
          [x - 1, y],
          [x, y + 1],
          [x, y - 1]
        ];

        neighbors.forEach(([nx, ny]) => {
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
            return;
          }
          const index = ny * width + nx;
          if (!mask[index] || visited[index]) {
            return;
          }
          visited[index] = 1;
          queueX[tail] = nx;
          queueY[tail] = ny;
          tail += 1;
        });
      }

      const bounds = { minX, minY, maxX, maxY };
      const rectWidth = maxX - minX + 1;
      const rectHeight = maxY - minY + 1;
      const aspect = rectHeight / rectWidth;
      if (area < 800 || aspect < 0.8 || aspect > 1.8) {
        continue;
      }

      const score = scorePortraitBounds(bounds) + area;
      if (!best || score > best.score) {
        best = { ...bounds, score };
      }
    }
  }

  return best;
}

function findPhotoLikeComponent(imageData, width, height) {
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const r = imageData[index];
      const g = imageData[index + 1];
      const b = imageData[index + 2];
      const a = imageData[index + 3];
      if (a > 20 && (r < 245 || g < 245 || b < 245)) {
        mask[y * width + x] = 1;
      }
    }
  }

  const visited = new Uint8Array(width * height);
  const queueX = new Int32Array(width * height);
  const queueY = new Int32Array(width * height);
  let best = null;

  for (let startY = 0; startY < height; startY += 1) {
    for (let startX = 0; startX < width; startX += 1) {
      const startIndex = startY * width + startX;
      if (!mask[startIndex] || visited[startIndex]) {
        continue;
      }

      let head = 0;
      let tail = 0;
      visited[startIndex] = 1;
      queueX[tail] = startX;
      queueY[tail] = startY;
      tail += 1;

      let minX = startX;
      let minY = startY;
      let maxX = startX;
      let maxY = startY;
      let area = 0;

      while (head < tail) {
        const x = queueX[head];
        const y = queueY[head];
        head += 1;
        area += 1;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);

        const neighbors = [
          [x + 1, y],
          [x - 1, y],
          [x, y + 1],
          [x, y - 1]
        ];

        neighbors.forEach(([nx, ny]) => {
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
            return;
          }
          const index = ny * width + nx;
          if (!mask[index] || visited[index]) {
            return;
          }
          visited[index] = 1;
          queueX[tail] = nx;
          queueY[tail] = ny;
          tail += 1;
        });
      }

      const rectWidth = maxX - minX + 1;
      const rectHeight = maxY - minY + 1;
      const aspect = rectHeight / rectWidth;
      const coverage = area / (rectWidth * rectHeight);
      const centerX = (minX + maxX) / 2 / width;
      const centerY = (minY + maxY) / 2 / height;

      if (area < 3000) {
        continue;
      }
      if (rectWidth < width * 0.18 || rectWidth > width * 0.72) {
        continue;
      }
      if (rectHeight < height * 0.2 || rectHeight > height * 0.82) {
        continue;
      }
      if (aspect < 0.95 || aspect > 1.75) {
        continue;
      }
      if (coverage < 0.45) {
        continue;
      }
      if (centerX < 0.3 || centerX > 0.82) {
        continue;
      }
      if (centerY < 0.15 || centerY > 0.72) {
        continue;
      }

      const score =
        area +
        rectHeight * 2 -
        Math.abs(centerX - 0.58) * 12000 -
        Math.abs(centerY - 0.42) * 12000 -
        Math.abs(aspect - 1.28) * 6000;

      if (!best || score > best.score) {
        best = { minX, minY, maxX, maxY, score };
      }
    }
  }

  return best;
}

async function extractPdfPortrait(file) {
  const pdfjsLib = await loadPdfJs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const firstPage = await pdf.getPage(1);
  const textContent = await firstPage.getTextContent();
  const viewport = firstPage.getViewport({ scale: 1.8 });
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  await firstPage.render({ canvasContext: context, viewport }).promise;
  maskTextRegions(context, textContent, viewport, pdfjsLib);

  const candidateRegions = [
    { x: 0.48, y: 0.08, width: 0.32, height: 0.34 },
    { x: 0.54, y: 0.08, width: 0.26, height: 0.28 },
    { x: 0.58, y: 0.1, width: 0.22, height: 0.24 }
  ];

  let bestCrop = null;

  candidateRegions.forEach((region) => {
    const cropX = Math.floor(canvas.width * region.x);
    const cropY = Math.floor(canvas.height * region.y);
    const cropWidth = Math.floor(canvas.width * region.width);
    const cropHeight = Math.floor(canvas.height * region.height);

    const imageData = context.getImageData(cropX, cropY, cropWidth, cropHeight);
    const bounds =
      findPhotoLikeComponent(imageData.data, cropWidth, cropHeight) ||
      findLargestForegroundComponent(imageData.data, cropWidth, cropHeight) ||
      detectNonWhiteBounds(imageData.data, cropWidth, cropHeight);
    if (!bounds) {
      return;
    }

    const score = scorePortraitBounds(bounds);
    if (!bestCrop || score > bestCrop.score) {
      bestCrop = { cropX, cropY, cropWidth, cropHeight, bounds, score };
    }
  });

  if (!bestCrop) {
    return "";
  }

  const { cropX, cropY, bounds } = bestCrop;
  const paddingX = 6;
  const paddingTop = 8;
  const paddingBottom = 10;
  const finalX = Math.max(0, cropX + bounds.minX - paddingX);
  const finalY = Math.max(0, cropY + bounds.minY - paddingTop);
  const finalWidth = Math.min(canvas.width - finalX, bounds.maxX - bounds.minX + paddingX * 2);
  const finalHeight = Math.min(canvas.height - finalY, bounds.maxY - bounds.minY + paddingTop + paddingBottom);

  if (finalWidth < 60 || finalHeight < 60) {
    return "";
  }

  const targetSize = 520;
  const portraitCanvas = document.createElement("canvas");
  const portraitContext = portraitCanvas.getContext("2d");
  portraitCanvas.width = targetSize;
  portraitCanvas.height = targetSize;
  portraitContext.fillStyle = "#ffffff";
  portraitContext.fillRect(0, 0, targetSize, targetSize);

  const scale = Math.min(targetSize / finalWidth, targetSize / finalHeight);
  const drawWidth = finalWidth * scale;
  const drawHeight = finalHeight * scale;
  const drawX = (targetSize - drawWidth) / 2;
  const drawY = (targetSize - drawHeight) / 2;
  portraitContext.drawImage(
    canvas,
    finalX,
    finalY,
    finalWidth,
    finalHeight,
    drawX,
    drawY,
    drawWidth,
    drawHeight
  );

  return portraitCanvas.toDataURL("image/png");
}

async function importProfile(rawText, sourceName, photoDataUrl, pdfBase64) {
  return fetchJson("/api/profiles/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      raw_text: rawText,
      source_name: sourceName,
      photo_data_url: photoDataUrl,
      pdf_base64: pdfBase64
    })
  });
}

async function handlePdfImport(event) {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  setImporterStatus(`Importing ${file.name} ...`);

  try {
    const [extractedText, portraitDataUrl, pdfBase64] = await Promise.all([
      extractPdfText(file),
      extractPdfPortrait(file),
      fileToBase64(file)
    ]);
    setPreviewText(extractedText || "No readable text detected in the PDF.");

    if (!extractedText.trim()) {
      setImporterStatus("The PDF was loaded, but no text could be extracted.");
      return;
    }

    setImporterStatus(`Text extracted from ${file.name}. Parsing and saving to MySQL ...`);
    const payload = await importProfile(
      extractedText,
      file.name,
      appState.manualPhotoDataUrl || portraitDataUrl,
      pdfBase64
    );
    appState.sourceRawText = extractedText;
    appState.sourceFileName = file.name;
    appState.siteData = buildImportedSiteData(payload.profile.data);
    syncTranslationState();
    renderSite();
    setImporterStatus(`Imported ${file.name} successfully and saved to the database.`);
    setView("profile");
    await loadProfileList();
  } catch (error) {
    setImporterStatus(error.message || "PDF import failed.");
  }
}

function resetImportedContent() {
  appState.siteData = cloneDefaultSiteData();
  appState.manualPhotoDataUrl = "";
  appState.activeProfileId = null;
  appState.sourceRawText = "";
  appState.sourceFileName = "";
  syncTranslationState();
  renderSite();
  updateImporterVisibility();
  setPreviewText("The parsed PDF text will appear here after import.");
  setImporterStatus("Reset complete. The template is back to its default content.");
  document.getElementById("pdf-input").value = "";
  document.getElementById("photo-input").value = "";
}

async function handlePhotoImport(event) {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    appState.manualPhotoDataUrl = String(reader.result || "");
    appState.siteData.profile.photo = appState.manualPhotoDataUrl || cloneDefaultSiteData().profile.photo;
    fillProfile();
    setImporterStatus(`Loaded custom photo: ${file.name}. The next PDF import will use this image.`);
  };
  reader.readAsDataURL(file);
}

function bindEvents() {
  document.getElementById("pdf-input").addEventListener("change", handlePdfImport);
  document.getElementById("photo-input").addEventListener("change", handlePhotoImport);
  document.getElementById("reset-button").addEventListener("click", resetImportedContent);
  document.getElementById("global-language-toggle-button").addEventListener("click", toggleLanguage);
  document.getElementById("profile-list").addEventListener("click", async (event) => {
    const pinButton = event.target.closest("[data-pin-profile-id]");
    if (pinButton) {
      event.stopPropagation();
      const isPinned = pinButton.getAttribute("data-pinned") === "true";
      await updateProfilePin(pinButton.getAttribute("data-pin-profile-id"), !isPinned);
      return;
    }

    const deleteButton = event.target.closest("[data-delete-profile-id]");
    if (deleteButton) {
      event.stopPropagation();
      await deleteProfile(deleteButton.getAttribute("data-delete-profile-id"));
      return;
    }

    const card = event.target.closest("[data-profile-id]");
    if (card) {
      await loadProfileDetail(card.getAttribute("data-profile-id"));
    }
  });
  document.getElementById("create-profile-button").addEventListener("click", () => {
    setView("profile");
    resetImportedContent();
  });
  document.getElementById("back-to-library").addEventListener("click", async () => {
    setView("library");
    await loadProfileList();
  });
  document.getElementById("profile-search").addEventListener("input", filterProfiles);
  document.getElementById("profile-sort").addEventListener("change", (event) => {
    appState.profileSort = event.target.value;
    renderCurrentProfileList();
  });
}

async function initApp() {
  renderSite();
  bindEvents();
  setView("library");
  syncStaticModeControls();
  updateImporterVisibility();
  await loadProfileList();
}

initApp();
