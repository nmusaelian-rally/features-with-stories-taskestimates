Ext.define('CustomApp', {
    extend: 'Rally.app.TimeboxScopedApp',
    componentCls: 'app',
    scopeType: 'release',
    comboboxConfig: {
        fieldLabel: 'Select a Release:',
        labelWidth: 100,
        width: 300
    },

    addContent: function() {
        this._makeStore();
    },
    
    _makeStore: function(){
        console.log("make store");
         Ext.create('Rally.data.WsapiDataStore', {
            model: 'PortfolioItem/Feature',
            fetch: ['FormattedID','Name', 'UserStories'],
            context: {
                context: this.getContext().getDataContext()
            },
            pageSize: 100,
            autoLoad: true,
            filters: [this.getContext().getTimeboxScope().getQueryFilter()],
            listeners: {
                load: this._onDataLoaded,
                scope: this
            }
        }); 
    },
    
   onScopeChange: function() {
        this._makeStore();
    },
    
    _onDataLoaded: function(store, data){
         console.log("on data loaded...");
                var features = [];
                var pendingstories = data.length;
                if (data.length ===0) {
                        this._createGrid(features);  //to force refresh on grid when there are no features in iteration
                }
                Ext.Array.each(data, function(feature) {
                            var f  = {
                                FormattedID: feature.get('FormattedID'),
                                Name: feature.get('Name'),
                                _ref: feature.get("_ref"),
                                UserStories: [],
                                StoryCount: feature.get('UserStories').Count,
                                SumOfTotalEstimates: 0,
                                SumOfTotalRemaining: 0
                            };
                            
                        var stories = feature.getCollection('UserStories', {fetch: ['FormattedID','Owner', 'Tasks', 'TaskEstimateTotal', 'TaskRemainingTotal']});
                           stories.load({
                                callback: function(records, operation, success){
                                    Ext.Array.each(records, function(story){
                                        //if (story.get('TaskEstimateTotal')) {
                                            f.SumOfTotalEstimates += story.get('TaskEstimateTotal');
                                            f.SumOfTotalRemaining += story.get('TaskRemainingTotal');
                                        //}
                                            f.UserStories.push({
                                            _ref: story.get('_ref'),
                                            FormattedID: story.get('FormattedID'),
                                            TaskEstimateTotal: story.get('TaskEstimateTotal'),
                                            TaskRemainingTotal: story.get('TaskRemainingTotal'),
                                            Owner:  (story.get('Owner') && story.get('Owner')._refObjectName) || 'None'
                                                    });
                                    }, this);
                                    
                                    --pendingstories;
                                    if (pendingstories === 0) {
                                        this._createGrid(features);
                                    }
                                },
                                scope: this
                            });
                            features.push(f);
                }, this);
    },
    
    _createGrid: function(features) {
         console.log("create grid");
        var featureStore = Ext.create('Rally.data.custom.Store', {
                data: features,
                pageSize: 100,
                remoteSort:false
            });
        
        if (!this.down('#fgrid')){
         this.add({
            xtype: 'rallygrid',
            itemId: 'fgrid',
            store: featureStore,
            columnCfgs: [
                {
                   text: 'Formatted ID', dataIndex: 'FormattedID', xtype: 'templatecolumn',
                    tpl: Ext.create('Rally.ui.renderer.template.FormattedIDTemplate')
                },
                {
                    text: 'Name', dataIndex: 'Name'
                },
                {
                    text: 'Story Count', dataIndex: 'StoryCount'
                },
               
                {
                    text: 'User Stories with Task data', dataIndex: 'UserStories', minWidth: 150,
                    renderer: function(value) {
                        var html = [];
                        Ext.Array.each(value, function(userstory){
                            html.push('<a href="' + Rally.nav.Manager.getDetailUrl(userstory) + '">' + userstory.FormattedID + '</a>' +  ' TaskEstTotal:' + userstory.TaskEstimateTotal +  ' TaskRemainingTotal:' + userstory.TaskRemainingTotal);
                        });
                        return html.join('</br>');
                    }
                },
                {
                    text: 'Story Owner', dataIndex: 'UserStories', 
                    renderer: function(value) {
                        var html = [];
                        Ext.Array.each(value, function(userstory){
                            html.push(userstory.Owner);
                        });
                        return html.join('</br></br>');
                    }
                },
                {
                    text: 'Sum of Total Estimates', dataIndex: 'SumOfTotalEstimates', 
                },
                 {
                    text: 'Sum of Total Remaining', dataIndex: 'SumOfTotalRemaining', 
                }
                
            ]
            
        });
        }
        else{
            this.down('#fgrid').reconfigure(featureStore);
        }
    }
       
});
