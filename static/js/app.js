(function() {

  'use strict';

  angular.module('app', [])
    .controller('contactsController', contactsController);

  function contactsController($http) {

    var vm = this;

    vm.contacts = [];
    vm.errorMessage = '';
    vm.isBusy = true;

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

    function setContactDates(){
      angular.forEach(vm.contacts, function(contact) {
        contact.lastContactMessage = 'Last contact ';
        if (contact.lastContactAt)
          contact.lastContactMessage += moment(contact.lastContactAt).fromNow();
        else
          contact.lastContactMessage += 'never';
      });
    }

  }

})();
