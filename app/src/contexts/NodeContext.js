// contexts/NodeContext.js
import React from 'react';

const HandleProcessSelectionContext = React.createContext({
  handleProcessSelection: (processId) => console.log("Default process selection handler"),
});

export const NodeContextProvider = ({ children, value }) => (
  <HandleProcessSelectionContext.Provider value={value}>
    {children}
  </HandleProcessSelectionContext.Provider>
);

export default HandleProcessSelectionContext;
