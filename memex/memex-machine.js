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
        "viewingNode",
        reduce((ctx, ev) => ({
          ...ctx,
          currentNodeData: ev.data,
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
