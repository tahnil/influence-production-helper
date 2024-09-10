// This ui component will allow users to manage saved production chains and derived product chains.
// 
// – Users can see the list of saved production chains and derived product chains.
// – Users can delete items from the list.
// – Maybe we will allow users to give a custom description to their production chains and derived product chains.
// 
// I guess we need to manage the state upwards in the TreeRenderer, because our ProductNode component 
// needs access to the state for writing both derived products and production chains to it.