import {
  createMachine,
  interpret,
  invoke,
  transition,
  reduce,
  state,
} from "https://unpkg.com/robot3?module";

const createMemexMachine = () =>
  createMachine({
    init: state(
      transition(
        "enterNode",
        "loadingNode",
        reduce((ctx, ev) => ({ ...ctx, currentNodeId: ev.nodeId }))
      ),
      transition("index", "indexing")
    ),
    indexing: invoke(
      loadIndex,
      transition(
        "done",
        "viewingIndex",
        reduce((ctx, ev) => ({
          ...ctx,
          index: ev.data,
        }))
      )
    ),
    viewingIndex: state(
      transition(
        "enterNode",
        "loadingNode",
        reduce((ctx, ev) => ({ ...ctx, currentNodeId: ev.nodeId }))
      )
    ),
    loadingNode: invoke(
      loadNode,
      transition(
        "done",
        "mappingNode",
        reduce((ctx, ev) => ({
          ...ctx,
          currentNodeData: ev.data,
        }))
      )
    ),
    mappingNode: invoke(
      mapNode,
      transition(
        "done",
        "viewingNode",
        reduce((ctx, ev) => ({
          ...ctx,
          currentNodeRichData: ev.data,
        }))
      )
    ),
    viewingNode: state(
      transition(
        "enterNode",
        "loadingNode",
        reduce((ctx, ev) => ({ ...ctx, currentNodeId: ev.nodeId }))
      ),
      transition("index", "indexing")
    ),
  });

export const interpretMemexMachine = (consumer) => {
  return interpret(createMemexMachine(), (service) =>
    consumer({
      state: service.machine.current,
      ...service.context,
      ...mapCallbacksToSend(service.send),
    })
  );
};

const mapCallbacksToSend = (send) => ({});

// TODO use caching here
async function mapNode({ currentNodeData, index }) {
  if (!index) {
    index = await loadIndex();
  }
  const richData = currentNodeData.split("\n").map(linkTokenizer(index));
  console.log(richData);
  return richData;
}

const linkTokenizer = (index) => (line) => {
  if (!line) {
    return [];
  }

  if (!index) {
    console.log("no index");
    return [line];
  }

  const match = findFirstMatch(index)(line);

  if (!match) {
    console.log("no match");
    return [line];
  }

  if (match.text === line) {
    return [match];
  }

  const [left, right] = line.split(match.text);
  const rest = index.slice(index.indexOf(match.node));
  console.log("match!" + JSON.stringify(match));
  return [
    ...linkTokenizer(rest)(left),
    match,
    ...linkTokenizer(rest)(right),
  ].filter(Boolean);
};

const findFirstMatch = (index) => (line) => {
  for (const node of index) {
    const match = findMatch(line)(node);
    if (match) {
      return match;
    }
  }
};

const findMatch = (line) => (node) => {
  const nodeNameDelimiters = ["_", "-"];
  const replaceDelimiter = (name, delim) => name.replaceAll(delim, " ");
  const sanitizedNodeName = nodeNameDelimiters
    .reduce(replaceDelimiter, withoutExt(node.name))
    .toLowerCase();

  const indexInLine = line.toLowerCase().indexOf(sanitizedNodeName);

  if (indexInLine === -1) {
    return;
  }

  const contentInLine = line.slice(
    indexInLine,
    indexInLine + sanitizedNodeName.length
  );

  return {
    text: contentInLine,
    node,
  };
};

const withoutExt = (name) => {
  const [nameWithoutExt] = name.split(".");
  return nameWithoutExt;
};

async function loadNode({ currentNodeId }) {
  const response = await fetch(
    `https://api.github.com/repos/Michigander/fieldnotes/contents/nodes/${currentNodeId}`,
    {
      method: "GET",
      headers: {
        "content-type": "application/json",
      },
    }
  );

  const responseJson = await response.json();

  const nodeText = atob(responseJson.content);

  return nodeText;
}

async function loadIndex() {
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

//
