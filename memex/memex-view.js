import { html, render } from "https://unpkg.com/lit-html?module";

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

const memex = (props) => {
  console.log(`update: ${JSON.stringify(props.state, null, 2)}`);
  switch (props.state) {
    case "indexing":
      return html`indexing...`;
    case "viewingIndex":
      return memexIndex(props.index);
    case "loadingNode":
      return html`loading...`;
    case "viewingNode":
      return html`<div class="node-content">${props.currentNodeData}</div>`;

    default:
      return html`MACHINE IN UNKNOWN STATE`;
  }
};

export const renderMemex = (props) =>
  render(memex(props), document.body.querySelector(".content"));
