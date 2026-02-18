import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <img src="/logo.svg" alt="ray-menu" width={20} height={20} />
          ray-menu
        </>
      ),
      url: "/",
    },
    githubUrl: "https://github.com/agmmnn/ray-menu",
    links: [
      {
        text: "Playground",
        url: "/playground",
      },
      {
        text: "Docs",
        url: "/docs",
        active: "nested-url",
      },
    ],
  };
}
