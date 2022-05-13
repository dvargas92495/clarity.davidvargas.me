import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLoaderData } from "@remix-run/react";
import type { LoaderFunction } from "@remix-run/server-runtime";
import getWorkConnections from "../../../../data/getWorkConnections.server";
import type { ForceGraph2D } from "react-force-graph";
import type { LinkObject } from "react-force-graph-2d";
import NumberInput from "@dvargas92495/ui/components/NumberInput";

const DEFAULT_NODE_RADIUS = 10;
const DEFAULT_LINK_WIDTH_MULTIPLIER = 0.2;

const ImageCache: Record<string, HTMLImageElement> = {};
const getImage = (src: string) => {
  const s =
    src === "404" || src.includes("drive.google.com") ? "/favicon.ico" : src;
  if (ImageCache[s]) return ImageCache[s];
  const img = new Image();
  img.src = s;
  return (ImageCache[s] = img);
};
const getId = (l: LinkObject, acc: "source" | "target") => {
  const node = l[acc];
  return typeof node === "undefined"
    ? ""
    : typeof node === "string"
    ? node
    : typeof node === "number"
    ? node.toString()
    : `${node.id}`;
};
const ForceView = () => {
  const data = useLoaderData<Awaited<ReturnType<typeof getWorkConnections>>>();
  const [ForceGraph, setForceGraph] = useState<typeof ForceGraph2D>();
  const [nodesSelected, setNodesSelected] = useState(new Set());
  const [nodeHovered, setNodeHovered] = useState("");
  const nodeById = useMemo(
    () => Object.fromEntries(data.nodes.map(({ id, ...n }) => [id, n])),
    [data.nodes]
  );
  const edgesByIds = useMemo(
    () =>
      data.links.reduce((p, c) => {
        const compositeId = `${c.source}|${c.target}`;
        if (p[compositeId]) {
          p[compositeId].push(c);
        } else {
          p[compositeId] = [c];
        }
        return p;
      }, {} as Record<string, typeof data.links>),
    [data.links]
  );
  const [radius, setRadius] = useState(DEFAULT_NODE_RADIUS);
  const [linkWidthMul, setLinkWidthMul] = useState(
    DEFAULT_LINK_WIDTH_MULTIPLIER
  );
  const getLinkWidth = useCallback(
    (edge) =>
      edgesByIds[`${edge.source.id}|${edge.target.id}`]?.length * linkWidthMul,
    [edgesByIds, linkWidthMul]
  );
  const nodeCanvasObject = useCallback<
    Required<Parameters<typeof ForceGraph2D>[0]>["nodeCanvasObject"]
  >(
    (node, canvas) => {
      const { id = "" } = node;
      const src = nodeById[id]?.avatar || "";
      if (nodesSelected.has(id)) {
        // draw an outline
      }
      try {
        if (nodeHovered && nodeHovered !== id) canvas.globalAlpha = 0.25;
        else canvas.globalAlpha = 1;
        canvas.drawImage(
          getImage(src),
          (node.x || 0) - radius,
          (node.y || 0) - radius,
          radius * 2,
          radius * 2
        );
      } catch (e) {
        console.error("Failed to draw", node.id, "with source", src);
        console.error(e);
      }

      canvas.restore();
    },
    [radius, nodesSelected, nodeHovered]
  );
  /* Not working yet
  const linkCanvasObject = useCallback<
    Required<Parameters<typeof ForceGraph2D>[0]>["linkCanvasObject"]
  >(
    (link, canvas) => {
      if (
        !nodeHovered ||
        nodeHovered === getId(link, "source") ||
        nodeHovered === getId(link, "target")
      )
        canvas.globalAlpha = 1;
      else canvas.globalAlpha = 0.25;
    },
    [nodeHovered]
  );
  */
  const graphData = useMemo(() => {
    const links =
      nodesSelected.size === 0
        ? data.links
        : data.links.filter(
            (l) =>
              nodesSelected.has(getId(l, "source")) ||
              nodesSelected.has(getId(l, "target"))
          );
    const nodesInLinks = new Set(
      links.flatMap((l) => [getId(l, "source"), getId(l, "target")])
    );
    const nodes =
      nodesSelected.size === 0
        ? data.nodes
        : data.nodes.filter((node) => nodesInLinks.has(node.id));
    return { nodes, links };
  }, [nodesSelected, data]);
  useEffect(() => {
    import("react-force-graph").then(({ ForceGraph2D }) => {
      setForceGraph(ForceGraph2D);
    });
  }, [setForceGraph]);
  return (
    <div>
      <style>{`.force-graph-container {
    border: 1px dashed #88888880;
    border-radius: 16px;
    height: 800px;
    width: 800px;
  }`}</style>
      {ForceGraph ? (
        <ForceGraph
          graphData={graphData}
          height={800}
          width={800}
          nodeRelSize={radius}
          nodeLabel={(node) => nodeById[node.id || ""]?.name || "Unknown User"}
          nodeCanvasObject={nodeCanvasObject}
          // linkCanvasObject={linkCanvasObject}
          // linkCanvasObjectMode={() => "before"}
          linkWidth={getLinkWidth}
          linkColor={() => "#000000"}
          onNodeClick={(node) => {
            if (nodesSelected.has(node.id)) {
              nodesSelected.delete(node.id);
            } else {
              nodesSelected.add(node.id);
            }
            setNodesSelected(new Set(nodesSelected));
          }}
          onNodeHover={(node) => {
            setNodeHovered((node?.id as string) || "");
          }}
        />
      ) : (
        <div style={{ height: 800 }}>Loading...</div>
      )}
      {/* </React.Fragment> */}
      <div className="mt-12">
        <h1 className="text-2xl font-bold mb-8">Settings</h1>
        <div className="flex gap-16 items-start justify-start">
          <div>
            <h2 className={"text-lg font-semibold mb-3"}>View Options</h2>
            <NumberInput
              label={"Radius"}
              defaultValue={DEFAULT_NODE_RADIUS}
              onChange={(e) => setRadius(Number(e.target.value))}
            />
            <NumberInput
              label={"Link Width Multiplier"}
              defaultValue={DEFAULT_LINK_WIDTH_MULTIPLIER}
              step={0.01}
              onChange={(e) => setLinkWidthMul(Number(e.target.value))}
            />
          </div>
          <div>
            <h2 className={"text-lg font-semibold mb-3"}>
              Other Options Coming Soon...
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
};

export const loader: LoaderFunction = async () => {
  return getWorkConnections();
};

export const handle = {
  header: "New Force Graph",
};

export default ForceView;
