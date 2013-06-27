/*

Tasks by Story by Iteration App
By Richard Green

This app displays all the tasks of every story of an iteration. You can choose which iteration you want to look at
with the combobox. If there are no stories or tasks, a panel is created that tells the user what happened, as opposed
to just having empty space where the grid should be.

This app was written in coffeescript, but updates to it can be made to either the App.coffee file or the App.js file.

I hope this app helps you!
*/


(function() {
  Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {
      var iterationCombobox;
      iterationCombobox = Ext.create('Rally.ui.combobox.IterationComboBox', {
        listeners: {
          select: function(combobox) {
            return this.storiesByIteration(combobox.getRecord().get('_ref'));
          },
          ready: function(combobox) {
            return this.storiesByIteration(combobox.getRecord().get('_ref'));
          },
          scope: this
        },
        storeConfig: {
          fetch: ['Name', 'Notes', '_ref', 'StartDate', 'EndDate', 'ObjectID', 'State']
        }
      });
      return this.add(iterationCombobox);
    },
    storiesByIteration: function(iterationRef) {
      var storyStore;
      return storyStore = Ext.create('Rally.data.WsapiDataStore', {
        model: 'User Story',
        autoLoad: true,
        fetch: ['Name', 'ScheduleState', 'PlanEstimate', '_ref'],
        filters: [
          {
            property: 'Iteration',
            operator: '=',
            value: iterationRef
          }
        ],
        listeners: {
          load: function(store, storyRecords) {
            if (storyRecords.length !== 0) {
              return this.tasksByStory(storyRecords);
            } else {
              return this.createEmptyPanel('Stories');
            }
          },
          scope: this
        }
      });
    },
    tasksByStory: function(storyRecords) {
      var stories, taskFilter, taskFilters, taskStore;
      stories = [];
      taskFilters = [];
      Ext.Array.each(storyRecords, function(record) {
        stories[record.data._ref] = record;
        return taskFilters.push({
          property: 'WorkProduct',
          operator: '=',
          value: record.data._ref
        });
      });
      taskFilter = Rally.data.QueryFilter.or(taskFilters);
      console.log(taskFilter);
      return taskStore = Ext.create('Rally.data.WsapiDataStore', {
        model: 'Task',
        autoLoad: true,
        fetch: ['Name', 'State', 'Estimate', 'ToDo', 'Actuals', '_ref', 'WorkProduct'],
        filters: taskFilter,
        listeners: {
          load: function(store, taskRecords) {
            if (taskRecords.length !== 0) {
              return this.aggregateData(taskRecords, stories);
            } else {
              return this.createEmptyPanel('Tasks');
            }
          },
          scope: this
        }
      });
    },
    aggregateData: function(taskRecords, stories) {
      var customStoreRecords;
      customStoreRecords = [];
      Ext.Array.each(taskRecords, function(taskRecord) {
        var storyRecord;
        storyRecord = stories[taskRecord.get('WorkProduct')._ref];
        return customStoreRecords.push({
          'StoryName': storyRecord.get('Name'),
          'ScheduleState': storyRecord.get('ScheduleState'),
          'PlanEstimate': storyRecord.get('PlanEstimate'),
          'StoryRef': storyRecord.get('_ref'),
          'TaskName': taskRecord.get('Name'),
          'State': taskRecord.get('State'),
          'Estimate': taskRecord.get('Estimate'),
          'ToDo': taskRecord.get('ToDo'),
          'Actuals': taskRecord.get('Actuals'),
          'TaskRef': taskRecord.get('_ref')
        });
      });
      return this.updateGrid(customStoreRecords);
    },
    createGrid: function(myStore) {
      if (this.emptyPanel != null) {
        this.remove(this.emptyPanel);
      }
      this.myGrid = Ext.create('Rally.ui.grid.Grid', {
        disableSelection: true,
        store: myStore,
        columnCfgs: [
          {
            text: 'Story Name',
            dataIndex: 'StoryName',
            flex: 2,
            renderer: function(value, meta, record) {
              return '<a href="' + Rally.nav.Manager.getDetailUrl(record.get('StoryRef')) + '">' + value + '</a>';
            }
          }, {
            text: 'ScheduleState',
            dataIndex: 'ScheduleState',
            flex: 1
          }, {
            text: 'Plan Estimate',
            dataIndex: 'PlanEstimate',
            flex: 1
          }, {
            text: 'Task Name',
            dataIndex: 'TaskName',
            flex: 2,
            renderer: function(value, meta, record) {
              return '<a href="' + Rally.nav.Manager.getDetailUrl(record.get('TaskRef')) + '">' + value + '</a>';
            }
          }, {
            text: 'State',
            dataIndex: 'State',
            flex: 1
          }, {
            text: 'Estimate',
            dataIndex: 'Estimate',
            flex: 1
          }, {
            text: 'ToDo',
            dataIndex: 'ToDo',
            flex: 1
          }, {
            text: 'Actuals',
            dataIndex: 'Actuals',
            flex: 1
          }
        ]
      });
      return this.add(this.myGrid);
    },
    updateGrid: function(customStoreRecords) {
      var myStore;
      myStore = Ext.create('Rally.data.custom.Store', {
        data: customStoreRecords
      });
      if (this.myGrid === void 0 || this.myGrid.isDestroyed) {
        if (this.emptyPanel != null) {
          this.remove(this.emptyPanel);
        }
        return this.createGrid(myStore);
      } else {
        return this.myGrid.reconfigure(myStore);
      }
    },
    createEmptyPanel: function(item) {
      if (this.myGrid != null) {
        this.remove(this.myGrid);
      }
      if (this.emptyPanel != null) {
        this.remove(this.emptyPanel);
      }
      this.emptyPanel = new Ext.Panel({
        title: 'No ' + item,
        titleAlign: 'center',
        html: "<I>No " + item + " in This Iteration</I>",
        style: {
          'text-align': 'center'
        },
        bodyStyle: {
          'font-size': '1.0em',
          'padding': '2px'
        }
      });
      return this.add(this.emptyPanel);
    }
  });

}).call(this);
