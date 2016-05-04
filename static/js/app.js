(function() {

  'use strict';

  angular.module('app', [])
    .controller('contactsController', contactsController);

  function contactsController($http) {

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

})();
