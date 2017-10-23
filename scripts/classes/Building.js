/**
 * @constructor
 * @param {object} props - Properties
 */
function Building(props)
{
  if (!(this instanceof Building)) {
    // Prevent accidental namespace pollution
    return new Building(props);
  }
  CivObj.call(this,props);
  copyProps(this,props,null,true);
  // Occasional Properties: subType, efficiency, devotion
  // plural should get moved during I18N.
  return this;
}

/**
 * Common Properties: type="building",customQtyId
 * @property {string} type      Always "building"
 * @property {string} alignment Always "player"
 * @property {string} place     Always "home"
 * @property {function} vulnerable Returns boolean if this building can be sacked
 * @property {customQtyId} string "buildingCustomQty" ?
 * @property {boolean} useProgressBar If true, will display progress during building
 * @property {number} progressTimeLeft Milliseconds of left building time. 0 means not building.
 */
Building.prototype = new CivObj(
  {
    constructor: Building,
    type: 'building',
    alignment:'player',
    place: 'home',
    get vulnerable() { return this.subType != 'altar'; }, // Altars can't be sacked.
    set vulnerable(value) { return this.vulnerable; }, // Only here for JSLint.
    customQtyId: 'buildingCustomQty',
    useProgressBar: true,
    progressTimeLeft: 0,

    /**
     * Get the td cell where progress bar will be put.
     * @return {object}
     */
    getProgressBarCell: function(id) {
      var cell = $('#' + id + 'Row .number');
      if (cell.length > 0) {
        return cell[0];
      }

      // If this is an altar
      cell = $('#' + id + 'Row .buildingtrue');
      if (cell.length > 0) {
        return cell[0];
      }

      throw 'Found no cell to put building progress bar in';
    },

    /**
     * @return {boolean} True if purchase row should be shown.
     */
    showPurchaseRow: function() {
      return this.owned > 0 || meetsPrereqs(this.prereqs);
    },

    /**
     * @return {string} HTML
     */
    updatePurchaseRow: function() {

      // If the item's cost is variable, update its requirements.
      if (this.hasVariableCost()) {
        updateRequirements(this);
      }

      const name = ucfirst(this.singular);
      const reqText = getReqText(this.require);
      return `
        <td>${name}</td>
        <td>${this.owned}</td>
        <td><button class='btn btn-default btn-sm x1' data-quantity='1'>1</button></td>
        <td><span class='text-muted'>${reqText}</span></td>
        <td><span class='text-muted'>${this.effectText}</span></td>
      `;
    }
  },
  true
);
