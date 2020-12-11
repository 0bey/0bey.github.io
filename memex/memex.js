import { html, render } from "https://unpkg.com/lit-html?module";
import { installRouter } from "https://unpkg.com/pwa-helpers/router.js";

// state
let state = {};

async function handleNodeUpdated(node) {
  if (!node) {
    state = {
      ...state,
      node,
    };
    renderMemex();
    return;
  }

  const response = await fetch(
    `https://api.github.com/repos/Michigander/fieldnotes/contents/nodes/${node}`,
    {
      method: "GET",
      headers: {
        "content-type": "application/json",
      },
    }
  );

  const responseJson = await response.json();

  const nodeText = atob(responseJson.content);

  console.log(nodeText);
  state = {
    ...state,
    node,
    content: {
      ...state.content,
      [node]: nodeText,
    },
  };

  renderMemex();
}

function handleRouterUpdated(location) {
  const search = Object.fromEntries(
    location.search
      .substring(1)
      .split(",")
      .map((str) => str.split("="))
  );

  if (search.node !== state.node) {
    handleNodeUpdated(search.node);
  }
}

async function initializeNodes() {
  const nodesResponse = await fetch(
    "https://api.github.com/repos/Michigander/fieldnotes/contents/nodes",
    {
      method: "GET",
      headers: {
        "content-type": "application/json",
      },
    }
  );
  const ghNodes = await nodesResponse.json();
  const nodes = ghNodes.map(({ download_url, name }) => ({
    download_url,
    name,
  }));
  return nodes;
}

async function initializeState() {
  const nodes = await initializeNodes();
  console.log(nodes);
  state = { ...state, nodes };
  renderMemex();
}

// view
const memexIndex = (nodes = []) => html`
  <h2>Nodes</h2>
  <ul>
    ${nodes.map(
      ({ download_url, name }) => html`
        <li>
          <a href="?node=${name}">${name}</a>
        </li>
      `
    )}
  </ul>
`;

const memexNode = (node) => {
  console.log("rendering node");
  return node;
};

const memex = (state) => {
  console.log(state);
  return html`<div id="memex">
    ${!state.node
      ? memexIndex(state.nodes)
      : memexNode(state.content[state.node])}
  </div>`;
};

const renderMemex = () =>
  render(memex(state), document.body.querySelector(".content"));

// main
renderMemex();
installRouter(handleRouterUpdated);
initializeState();
