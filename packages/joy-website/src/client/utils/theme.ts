export function getTheme() {
  const { href } = document.getElementById("theme-style") as HTMLLinkElement;

  return href.includes("dark") ? "dark" : "light";
}

export function changeTheme() {
  const newTheme = getTheme() === "dark" ? "light" : "dark";
  const themeUrl = newTheme === "dark" ? "/static/antd.dark.css" : "/static/antd.css";
  const oBody = document.getElementsByTagName("body")[0];
  const oLink = document.getElementById("theme-style") as HTMLLinkElement;

  localStorage.setItem("theme", newTheme);
  oLink.href = themeUrl;
  oBody.setAttribute("data-theme", newTheme);
}
