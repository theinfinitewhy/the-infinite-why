const menuButton = document.querySelector(".menu-button");
const navigationLinks = document.querySelector(".navigation-links");

if (menuButton && navigationLinks) {
    menuButton.addEventListener("click", () => {
        const menuIsOpen =
            menuButton.getAttribute("aria-expanded") === "true";

        menuButton.setAttribute(
            "aria-expanded",
            String(!menuIsOpen)
        );

        navigationLinks.classList.toggle("is-open");
    });
}