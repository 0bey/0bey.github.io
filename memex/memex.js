import { renderMemex } from "./memex-view.js";
import { interpretMemexMachine } from "./memex-machine.js";
import { installRouter } from "https://unpkg.com/pwa-helpers/router.js?module";

const service = interpretMemexMachine(renderMemex);

installRouter(({ href }) => {
  const asURL = new URL(href);
  const nodeId = asURL.searchParams.get("node");
  if (nodeId) {
    service.send({ type: "enterNode", nodeId });
  } else {
    service.send("index");
  }
});
