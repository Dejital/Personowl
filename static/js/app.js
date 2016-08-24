(function () {

  'use strict';

  angular.module('app', ['ngRoute'])
    .config(function ($routeProvider) {

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
    .controller('contactListController', contactListController)
    .controller('contactController', contactController);

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
        }
      });
    }

    function setContactFlags() {
      var now = moment(),
        threshold = 30;
      angular.forEach(vm.contacts, function(contact) {
        if (now.diff(contact.lastContactDate, 'days') > threshold) {
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

    $http.get('/api/contacts')
      .then(function (response) {
        angular.copy(response.data.contacts, vm.contacts);
        setContactDates();
        setContactFlags();
      }, function (error) {
        vm.errorMessage = 'Failed to load contacts data. ' + error;
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

    vm.filterByTag = function(tag) {
      vm.contactQuery = tag;
    };

    vm.selectTopContact = function() {
      var filtered = $filter('filter')(vm.contacts, vm.contactQuery);
      if (filtered.length > 0) {
        var contact = filtered[0];
        $location.path('/' + contact._id);
      }
    };

    vm.checkIn = function(contact) {
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
      }, function(error) {
        vm.errorMessage = 'Failed to load contact. ';
        vm.errorMessage += error;
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
        }, function (error) {
          vm.errorMessage = 'Failed to save changes to contact. ';
          vm.errorMessage += error;
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
        }, function (error) {
          vm.errorMessage = 'Failed to delete note. ';
          vm.errorMessage += error;
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
        }, function (error) {
          vm.errorMessage = 'Failed to delete interaction. ';
          vm.errorMessage += error;
        });
    };

    vm.deleteContact = function() {
      var url = '/api/contacts/' + id + '?_method=DELETE';
      $http.post(url, vm.contact)
        .then(function () {
          $location.path('/');
        }, function (error) {
          vm.errorMessage = 'Failed to delete contact. ';
          vm.errorMessage += error;
        });
    };

    function setContact(contact) {
      contact.tags = contact.tags.join(',');
      contact.lastContactMessage = getRelativeDateText(contact.lastContactAt);
      contact.displayName = contact.name || '[no name]';
      contact.interactions = formatInteractions(contact.interactions);
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
