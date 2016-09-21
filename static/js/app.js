(function () {

  'use strict';

  angular.module('app', ['ngRoute'])
    .config(function ($routeProvider, $locationProvider) {

      $routeProvider.when('/', {
        controller: 'contactListController',
        controllerAs: 'vm',
        templateUrl: '/views/contactsListView.html'
      });

      $routeProvider.when('/:id', {
        controller: 'contactController',
        controllerAs: 'vm',
        templateUrl: '/views/contactView.html'
      });

      $routeProvider.otherwise({ redirectTo: '/' });

    })
    .filter('orderContactsBy', orderContactsBy)
    .controller('contactListController', contactListController)
    .controller('contactController', contactController);

  function orderContactsBy ($filter) {
    return function (items, field, reverse) {

      var newContacts = [];
      var lastContacted = [];
      var snoozed = [];

      angular.forEach(items, function(item) {
        if (!item.lastContactAt && !item.snoozedUntil) {
          newContacts.push(item);
        } else if (item.lastContactAt && !item.snoozedUntil) {
          lastContacted.push(item);
        } else if (item.snoozedUntil) {
          snoozed.push(item);
        } else {
          newContacts.push(item);
        }
      });

      newContacts = $filter('orderBy')(newContacts, 'createdAt', true);
      lastContacted = $filter('orderBy')(lastContacted, 'lastContactAt');
      snoozed = $filter('orderBy')(snoozed, 'snoozedUntil', false);

      var filtered = newContacts.concat(lastContacted).concat(snoozed);
      if (reverse) {
        filtered.reverse();
      }

      return filtered;
    };
  }

  function contactListController($http, $filter, $location) {

    var vm = this;

    function setContactDates() {
      angular.forEach(vm.contacts, function(contact) {
        if (!contact.lastContactMessage) {
          contact.lastContactMessage = 'Last contact ';
          if (contact.lastContactAt) {
            contact.lastContactDate = Date.parse(contact.lastContactDate);
            contact.lastContactMessage += moment(contact.lastContactAt).fromNow();
          } else {
            contact.lastContactMessage += 'never';
          }
          if (contact.snoozedUntil) {
            contact.snoozedUntilMessage = 'Snoozed until ';
            contact.snoozedUntilMessage += moment(contact.snoozedUntil).format('MMMM Do YYYY');
          }
        }
      });
    }

    function setContactFlags() {
      var now = moment(),
        threshold = vm.preferences && vm.preferences.thresholdDays ? vm.preferences.thresholdDays : 30;
      angular.forEach(vm.contacts, function(contact) {
        if (now.diff(contact.lastContactAt, 'days') > threshold) {
          contact.expired = true;
        }
      });
    }

    vm.contacts = [];
    vm.contactQuery = '';
    vm.errorMessage = '';
    vm.isAddingContact = false;
    vm.isBusy = true;
    vm.newContact = {};
    vm.preferences = {};

    $http.get('/api/preferences')
      .then(function (response) {
        angular.copy(response.data.preferences, vm.preferences);
      }, function () {
        vm.errorMessage = 'Failed to load preferences.';
      });

    $http.get('/api/contacts')
      .then(function (response) {
        angular.copy(response.data.contacts, vm.contacts);
        setContactDates();
        setContactFlags();
      }, function () {
        vm.errorMessage = 'Failed to load contacts data.';
      })
      .finally(function() {
        vm.isBusy = false;
      });

    vm.addContact = function() {
      vm.isAddingContact = true;

      $http.post('/api/contacts', vm.newContact)
        .then(function(response) {
          vm.contacts.push(response.data.contact);
          vm.newContact = {};
          setContactDates();
        }, function() {
          vm.errorMessage = 'Failed to add new contact.';
        })
        .finally(function () {
          vm.isAddingContact = false;
        });
    };

    vm.updatePreferences = function() {
      vm.isUpdatingPreferences = true;
      var url = '/api/preferences?_method=PUT';
      $http.post(url, vm.preferences)
        .then(function () {

        }, function () {
          vm.errorMessage = 'Failed to update preferences. ';
        })
        .finally(function () {
          vm.isUpdatingPreferences = false;
          setContactFlags();
        });
    };

    vm.filterByTag = function(tag) {
      if (!vm.showFilter) {
        vm.toggleFilter();
      }
      vm.contactQuery = tag;
    };

    vm.selectTopContact = function() {
      var filtered = $filter('filter')(vm.contacts, vm.contactQuery);
      if (filtered.length > 0) {
        var contact = filtered[0];
        $location.path('/' + contact._id);
      }
    };

    vm.checkInContact = function (contact) {
      var url = '/api/contacts/' + contact._id + '/interactions';
      var data = { interaction: '' };
      $http.post(url, data)
        .then(function (response) {
          var newInteraction = response.data.interactions[response.data.interactions.length - 1];
          contact.lastContactAt = newInteraction.createdAt;
          contact.lastContactMessage = 'Last contact a moment ago.';
          contact.expired = false;
        }, function () {
          vm.errorMessage = 'Failed to add a new interaction.';
        });
    };
    
    vm.snoozeContact = function (contact) {
      var daysToSnooze = 7;
      if (vm.preferences && vm.preferences.snoozeDays) {
        daysToSnooze = vm.preferences.snoozeDays;
      }
      contact.snoozedUntil = moment().add(daysToSnooze, 'days').toDate();
      var url = '/api/contacts/' + contact._id + '?_method=PUT';
      $http.post(url, contact)
        .then(function (response) {
          contact.snoozedUntilMessage = 'Snoozed until ';
          contact.snoozedUntilMessage += moment(response.data.contact.snoozedUntil).format('MMMM Do YYYY');
        }, function () {
          vm.errorMessage = 'Failed to snooze contact. ';
        });
    };

    vm.removeSnooze = function (contact) {
      contact.snoozedUntil = null;
      var url = '/api/contacts/' + contact._id + '?_method=PUT';
      $http.post(url, contact)
        .then(function () {
          contact.snoozedUntilMessage = '';
        }, function () {
          vm.errorMessage = 'Failed to remove snooze from contact. ';
        });
    };

    vm.toggleAddContact = function () {
      if (vm.showAddContact) {
        vm.newContact.name = '';
        vm.showAddContact = false;
      } else {
        if (vm.showFilter) {
          vm.toggleFilter();
        } else if (vm.showPreferences) {
          vm.togglePreferences();
        }
        vm.showAddContact = true;
      }
    };

    vm.toggleFilter = function () {
      if (vm.showFilter) {
        vm.contactQuery = '';
        vm.showFilter = false;
      } else {
        if (vm.showAddContact) {
          vm.toggleAddContact();
        } else if (vm.showPreferences) {
          vm.togglePreferences();
        }
        vm.showFilter = true;
      }
    };

    vm.togglePreferences = function () {
      if (vm.showPreferences) {
        vm.showPreferences = false;
      } else {
        if (vm.showFilter) {
          vm.toggleFilter();
        } else if (vm.showAddContact) {
          vm.toggleAddContact();
        }
        vm.showPreferences = true;
      }
    };

  }

  function contactController($routeParams, $http, $location) {

    var vm = this;
    var id = $routeParams.id;

    vm.isBusy = true;
    vm.isSaving = false;
    vm.contact = {};
    vm.errorMessage = '';
    vm.newInteraction = '';
    vm.newNote = '';

    $http.get('/api/contacts/' + id)
      .then(function(response) {
        setContact(response.data.contact);
      }, function() {
        vm.errorMessage = 'Failed to load contact. ';
      })
      .finally(function() {
        vm.isBusy = false;
      });

    vm.saveChanges = function() {
      vm.isSaving = true;
      vm.errorMessage = '';

      var url = '/api/contacts/' + id + '?_method=PUT';
      $http.post(url, vm.contact)
        .then(function (response) {
          setContact(response.data.contact);
        }, function () {
          vm.errorMessage = 'Failed to save changes to contact. ';
        })
        .finally(function () {
          vm.isSaving = false;
        });
    };

    vm.addNote = function() {
      var url = '/api/contacts/' + id + '/notes';
      var data = { note: vm.newNote };
      $http.post(url, data)
        .then(function(response) {
          angular.copy(response.data.notes, vm.contact.notes);
          vm.newNote = '';
        }, function() {
          vm.errorMessage = 'Failed to add a new note.';
        });
    };

    vm.deleteNote = function (note) {
      var url = '/api/contacts/' + id + '/notes/' + note._id + '?_method=DELETE';
      $http.post(url, vm.contact)
        .then(function (response) {
          angular.copy(response.data.notes, vm.contact.notes);
        }, function () {
          vm.errorMessage = 'Failed to delete note. ';
        });
    };

    vm.addInteraction = function () {
      var url = '/api/contacts/' + id + '/interactions';
      var data = { interaction: vm.newInteraction };
      $http.post(url, data)
        .then(function(response) {
          var interactions = formatInteractions(response.data.interactions);
          angular.copy(interactions, vm.contact.interactions);
          vm.newInteraction = '';
        }, function() {
          vm.errorMessage = 'Failed to add a new interaction.';
        });
    };

    vm.deleteInteraction = function (interaction) {
      var url = '/api/contacts/' + id + '/interactions/' + interaction._id + '?_method=DELETE';
      $http.post(url, vm.contact)
        .then(function (response) {
          var interactions = formatInteractions(response.data.interactions);
          angular.copy(interactions, vm.contact.interactions);
        }, function () {
          vm.errorMessage = 'Failed to delete interaction. ';
        });
    };

    vm.deleteContact = function() {
      var url = '/api/contacts/' + id + '?_method=DELETE';
      $http.post(url, vm.contact)
        .then(function () {
          $location.path('/');
        }, function () {
          vm.errorMessage = 'Failed to delete contact. ';
        });
    };

    function setContact(contact) {
      if (!contact.tags) contact.tags = [];
      contact.tags = contact.tags.join(',');
      contact.lastContactMessage = getRelativeDateText(contact.lastContactAt);
      contact.displayName = contact.name || '[no name]';
      contact.interactions = formatInteractions(contact.interactions);
      if (contact.snoozedUntil) {
        contact.snoozedUntilMessage = moment(contact.snoozedUntil).format('MMMM Do YYYY');
      }
      angular.copy(contact, vm.contact);
    }

    function getRelativeDateText(date){
      if (date)
        return moment(date).fromNow();
      else
        return 'Never';
    }

    function formatInteractions(interactions) {
      angular.forEach(interactions, function(interaction) {
        interaction.displayDescription = interaction.description || '[no description]';
        interaction.displayDate = getRelativeDateText(interaction.createdAt);
      });
      return interactions;
    }

  }

})();
