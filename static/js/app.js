(function() {

  'use strict';

  angular.module('app', ['ngRoute'])
    .config(function($routeProvider) {

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

  function contactListController($http) {

    var vm = this;

    vm.contacts = [];
    vm.contactQuery = '';
    vm.errorMessage = '';
    vm.isAddingContact = false;
    vm.isBusy = true;
    vm.newContact = {};

    $http.get('/api/contacts')
      .then(function(response) {
        angular.copy(response.data.contacts, vm.contacts);
      }, function(error) {
        vm.errorMessage = 'Failed to load contacts data. ' + error;
      })
      .finally(function() {
        setContactDates();
        vm.isBusy = false;
      });

    vm.addContact = function() {
      vm.isAddingContact = true;

      $http.post('/api/contacts', vm.newContact)
        .then(function(response) {
          vm.contacts.push(response.data.contact);
          vm.newContact = {};
        }, function() {
          vm.errorMessage = 'Failed to add new contact.';
        })
        .finally(function () {
          setContactDates();
          vm.isAddingContact = false;
        });
    };

    vm.filterByTag = function(tag) {
      vm.contactQuery = tag;
    };

    function setContactDates(){
      angular.forEach(vm.contacts, function(contact) {
        if (!contact.lastContactMessage){
          contact.lastContactMessage = 'Last contact ';
          if (contact.lastContactAt)
            contact.lastContactMessage += moment(contact.lastContactAt).fromNow();
          else
            contact.lastContactMessage += 'never';
        }
      });
    }

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

    vm.deleteNote = function(note) {
      var url = '/api/contacts/' + id + '/notes/' + note._id + '?_method=DELETE';
      $http.post(url, vm.contact)
        .then(function (response) {
          angular.copy(response.data.notes, vm.contact.notes);
        }, function (error) {
          vm.errorMessage = 'Failed to delete note. ';
          vm.errorMessage += error;
        });
    };

    vm.addInteraction = function() {
      var url = '/api/contacts/' + id + '/interactions';
      var data = { interaction: vm.newInteraction };
      $http.post(url, data)
        .then(function(response) {
          angular.copy(response.data.interactions, vm.contact.interactions);
          vm.newInteraction = '';
        }, function() {
          vm.errorMessage = 'Failed to add a new interaction.';
        });
    };

    vm.deleteInteraction = function(interaction) {
      var url = '/api/contacts/' + id + '/interactions/' + interaction._id + '?_method=DELETE';
      $http.post(url, vm.contact)
        .then(function (response) {
          angular.copy(response.data.interactions, vm.contact.interactions);
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
      contact.lastContactMessage = getFormattedDate(contact.lastContactAt);
      angular.copy(contact, vm.contact);
    }

    function getFormattedDate(lastContactAt){
      if (lastContactAt)
        return moment(lastContactAt).fromNow();
      else
        return 'Never';
    }

  }

})();
