import React, { useContext, useState } from "react";

type ToolbarContextData = {
  data: Record<string, unknown>;
  setData: (data: Record<string, unknown>) => void;
};

const ToolbarContext = React.createContext<ToolbarContextData>({
  data: {},
  setData: () => {},
});

export const useToolbar = <T extends {}>(s: string) => {
  const { data, setData } = useContext(ToolbarContext);
  return {
    data: data[s] as T,
    setData: (d: T) => setData({ ...data, [s]: d }),
  };
};

export const ToolbarProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [data, setData] = useState({});
  return (
    <ToolbarContext.Provider value={{ data, setData }}>
      {children}
    </ToolbarContext.Provider>
  );
};
