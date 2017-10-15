/* @flow */
'use strict';

/**
 * Player earns culture points by achieveming certain goals, like
 * population above 10 or 100, or owning 200 food, and so on.
 * @property {array} cultureConditions List of conditions that grants culture points.
 * @property {array} fulfilledConditions List of conditions that has been fulfilled/done.
 */
CivClicker.plugins.Culture = (function() {

  /**
   * Condition class for culture points.
   * Private class hidden in closure.
   * @property {string} name
   * @property {object|function} requires Either a boolean method to test, or an object that can be fed to meetsPrereqs().
   * @property {number} points
   * @property {boolean} isFulfilled
   */
  class CultureCondition {

    /**
     * @param {string} name
     * @param {number} points
     * @param {object|function} requires
     */
    constructor(name, points, requires) {
      this.name = name;
      this.requires = requires;
      this.points = points;
      this._isFulfilled = false;
    }

    /**
     * @return {boolean}
     */
    isFulfilled() {
      if (typeof this.requires == 'object') {
        return meetsPrereqs(this.requires);
      } else {
        return this.requires();
      }
    }

    /**
     * Run after isFulfilled returns true to apply
     * this condition and give culture points.
     */
    fulfill() {
      this._isFulfilled = true;
      civData.culture.owned += this.points;
      const msg = `You gain ${this.points} culture point by ${this.name}!`;
      gameLog(msg);
      if (Notification.permission == 'granted') {
        new Notification(
          'CivClicker',
          {body: msg}
        );
      } else {
        new PNotify({
          title: 'Culture point',
          text: msg,
          timer: 1,
          type: 'notice',
          icon: false,
          buttons: {
            closer: true,
            closer_hover: false,
            sticker: false
          }
        });
      }
    }

    /**
     * Use to save.
     * JSON don't handle functions, so we need
     * another way to save/load require methods.
     * @return {string}
     */
    save() {
      return {
        name:         this.name,
        points:       this.points,
        requires:     this.requires.toString()
      }
    }

    /**
     * Load data object into proper class object.
     * @param {object} data 
     * @return {CultureCondition}
     */
    static load(data) {
      return new CultureCondition(
        data.name,
        data.points,
        eval(data.requires)
      );
    }

  }

  return new (class CulturePlugin {
    constructor() {
      // Subscription to event global.tick.
      this.tickSub = null;

      // True if data was loaded from save file.
      this._loaded = false;

      this.cultureConditions   = [];
      this.fulfilledConditions = [];
    }

    /**
     * Init plugin.
     */
    init() {
      // Only setup data if data was not loaded from save file.
      // TODO: Change flow?
      if (!this._loaded) {
        this.setupConditions();
      }
      this.tickSub = CivClicker.Events.subscribe('global.tick', () => {
        this.checkCultureConditions();
      });
    }

    /**
     * Setup available conditions.
     */
    setupConditions() {
      this.cultureConditions = [
        new CultureCondition(
          '10 population',
          1,
          () => {
            return population.living > 9;
          }
        )
      ];
      this.fulfilledConditions = [];
    }

    /**
     * Unload plugin.
     */
    unload() {
      if (this.tickSub) {
        this.tickSub.remove();
      }
    }

    /**
     * Save what conditions we've already fulfilled.
     */
    save() {
      return {
        cultureConditions: this.cultureConditions.map((cond) => cond.save()),
        fulfilledConditions: this.fulfilledConditions.map((cond) => {
          return cond.save();
        })
      };
    }

    /**
     * Load what conditions we've fulfilled.
     */
    load(data) {
      if (data.cultureConditions) {
        data.cultureConditions.forEach(cond => {
          this.cultureConditions.push(CultureCondition.load(cond));
        });
      }
      if (data.fulfilledConditions) {
        data.fulfilledConditions.forEach(cond => {
          if (cond) {
            this.fulfilledConditions.push(CultureCondition.load(cond));
          } else {
            console.error('Condition is null or undefined');
          }
        });
      }
      this._loaded = true;
    }

    /**
     * Called when game is reset by user.
     * Needed to make save/load work properly.
     */
    reset() {
      this._loaded = false;
      this.setupConditions();
    }

    /**
     * Loop through culture conditions and grant
     * culture point if fulfilled.
     */
    checkCultureConditions() {
      /** @type {number[]} */
      let remove = [];

      if (this.cultureConditions === undefined) {
        alert('Internal error: Found no culture conditions. Resetting game.');
        resetCivClicker();
        return;
      }

      // Check all remaining conditions.
      this.cultureConditions.forEach((condition, pos) => {
        if (condition.isFulfilled()) {
          condition.fulfill();
          // Remember position so we can move this condition to
          // the other array.
          remove.push(pos);
        }
      });

      // Move all fulfilled conditions to fulfilled array.
      remove.forEach((pos) => {
        let removed = this.cultureConditions.splice(pos, 1);
        this.fulfilledConditions.push(removed[0]);
      });
    }
  });

})();
