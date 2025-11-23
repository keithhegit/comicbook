import { onRequestGet as __api_library_js_onRequestGet } from "C:\\Users\\Og\\Desktop\\BananaNano\\comicbook\\functions\\api\\library.js"
import { onRequestPost as __api_upload_js_onRequestPost } from "C:\\Users\\Og\\Desktop\\BananaNano\\comicbook\\functions\\api\\upload.js"
import { onRequestGet as __comics___path___js_onRequestGet } from "C:\\Users\\Og\\Desktop\\BananaNano\\comicbook\\functions\\comics\\[[path]].js"

export const routes = [
    {
      routePath: "/api/library",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_library_js_onRequestGet],
    },
  {
      routePath: "/api/upload",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_upload_js_onRequestPost],
    },
  {
      routePath: "/comics/:path*",
      mountPath: "/comics",
      method: "GET",
      middlewares: [],
      modules: [__comics___path___js_onRequestGet],
    },
  ]