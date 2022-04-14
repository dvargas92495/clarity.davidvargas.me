import React from "react";
import getMeta from "@dvargas92495/ui/utils/getMeta";
import About from "@dvargas92495/ui/components/About";

const AboutPage: React.FunctionComponent = () => (
  <About title={"Clarity"} subtitle={"Description"} paragraphs={[]} />
);

export const meta = getMeta({ title: "About" });

export default AboutPage;
