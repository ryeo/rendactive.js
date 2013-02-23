// Generated by CoffeeScript 1.4.0

/* global: Bacon, Bacon.UI, Handlebars, rendactive, to_hash, uuid
*/


(function() {
  var app, createActions, createApplication, createModel, createStorage, createView;

  createStorage = function(id) {
    return {
      load: function() {
        return JSON.parse(localStorage.getItem(this._id) || '[]');
      },
      save: function(x) {
        return localStorage.setItem(this._id, JSON.stringify(x));
      }
    };
  };

  createActions = function() {
    var name;
    return to_hash((function() {
      var _i, _len, _ref, _results;
      _ref = ['creates', 'destroys', 'edits', 'toggles', 'megatoggles', 'clears'];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        name = _ref[_i];
        _results.push([name, new Bacon.Bus()]);
      }
      return _results;
    })());
  };

  createModel = function(initialTodos, actions) {
    var activeTodos, allTodos, clears, completedTodos, creates, destroys, edits, megatoggles, mutations, mutators, toggles;
    mutators = {
      append: function(newTodo) {
        return function(todos) {
          return todos.concat([newTodo]);
        };
      },
      create: function(title) {
        return mutators.append({
          id: uuid(),
          title: title,
          completed: false
        });
      },
      "delete": function(id) {
        return function(todos) {
          return _.reject(todos, function(t) {
            return t.id === id;
          });
        };
      },
      update: function(_arg) {
        var changes, id;
        id = _arg.id, changes = _arg.changes;
        return function(todos) {
          return _.map(todos, function(t) {
            if (t.id === id) {
              return _.defaults(changes, t);
            } else {
              return t;
            }
          });
        };
      },
      clearCompleted: function() {
        return function(todos) {
          return _.reject(todos, function(t) {
            return t.completed;
          });
        };
      },
      toggleAll: function(completed) {
        return function(todos) {
          return _.map(todos, function(t) {
            return _.defaults({
              completed: completed
            }, t);
          });
        };
      }
    };
    creates = actions.creates, destroys = actions.destroys, edits = actions.edits, toggles = actions.toggles, megatoggles = actions.megatoggles, clears = actions.clears;
    mutations = creates.map(mutators.create).merge(destroys.map(mutators["delete"])).merge(toggles.merge(edits).map(mutators.update)).merge(megatoggles.map(mutators.toggleAll)).merge(clears.map(mutators.clearCompleted));
    allTodos = mutations.scan(initialTodos, function(todos, f) {
      return f(todos);
    });
    activeTodos = allTodos.map(function(todos) {
      return _.where(todos, {
        completed: false
      });
    });
    completedTodos = allTodos.map(function(todos) {
      return _.where(todos, {
        completed: true
      });
    });
    return {
      allTodos: allTodos,
      activeTodos: activeTodos,
      completedTodos: completedTodos
    };
  };

  createView = function(model, actions, hash) {
    return rendactive(Handlebars.compile($("#app").html()), function(h) {
      var activeTodos, allTodos, clears, completedTodos, creates, destroys, editingId, edits, megatoggles, selectedTodos, title, toggles;
      title = h.inputValue('#new-todo').map(function(val) {
        return val.trim();
      });
      h.enters("#new-todo").onValue(function() {
        return $("#new-todo").val('');
      });
      creates = actions.creates, destroys = actions.destroys, edits = actions.edits, toggles = actions.toggles, megatoggles = actions.megatoggles, clears = actions.clears;
      creates.plug(h.enters("#new-todo").map(title).filter(_.identity));
      destroys.plug(h.ids("click [data-action=delete]"));
      edits.plug(h.enters(".edit").merge(h.blurs(".edit")).map(function(e) {
        return {
          id: $(e.target).data('id'),
          changes: {
            title: $(e.target).val().trim()
          }
        };
      }));
      destroys.plug(edits.filter(function(_arg) {
        var changes;
        changes = _arg.changes;
        return !changes.title;
      }).map(function(_arg) {
        var id;
        id = _arg.id;
        return id;
      }));
      toggles.plug(h.changes("[data-action=toggle]").map(function(e) {
        return {
          id: $(e.target).data('id'),
          changes: {
            completed: $(e.target).is(":checked")
          }
        };
      }));
      megatoggles.plug(h.checkboxBooleans("#toggle-all"));
      clears.plug(h.clicks("#clear-completed"));
      editingId = h.ids("dblclick label").merge(edits.map(null)).toProperty(null);
      h.valueAfterRender(editingId, function(id) {
        return $("#edit-" + id).focus();
      });
      allTodos = model.allTodos, activeTodos = model.activeTodos, completedTodos = model.completedTodos;
      selectedTodos = hash.decode({
        '#/': allTodos,
        '#/active': activeTodos,
        '#/completed': completedTodos
      });
      return {
        allTodos: allTodos,
        completedTodos: completedTodos,
        activeTodos: activeTodos,
        selectedTodos: selectedTodos,
        editingId: editingId
      };
    });
  };

  createApplication = function() {
    var actions, hash, model, storage, view;
    hash = Bacon.UI.hash('#/');
    storage = createStorage('todos-rendactive');
    actions = createActions();
    model = createModel(storage.load(), actions);
    view = createView(model, actions, hash);
    model.allTodos.onValue(storage.save);
    return {
      model: model,
      view: view,
      actions: actions
    };
  };

  app = createApplication();

  $('body').append(app.view.fragment);

}).call(this);
