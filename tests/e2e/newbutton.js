// v0.76.0 «Fünf Orte» 1: «New» is the round + on a phone and «+ Neu» in the sidebar on a computer.
// v0.98.0 Design-Refresh R2 (G4/G5): on a phone the + sits in the top bar next to the search, so it is
// always there and never steps aside; the first visible «New» button is the one a person taps.
export async function newButton(page, name) {
  return page.getByRole('button', { name, exact: true }).filter({ visible: true }).first();
}
