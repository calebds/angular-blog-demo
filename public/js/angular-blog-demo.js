// declare our app module and its dependencies
var angularBlogDemo = angular.module('blogDemoApp', ['ngRoute']);

// configure the app
angularBlogDemo.config(['$routeProvider', function($routeProvider) {

  $routeProvider
    .when('/', {
      templateUrl: '/partials/home.html',
      controller: 'HomeController'
    })
    .when('/post/:id', {
      controller: 'PostController',
      templateUrl: '/partials/post.html'
    })
    .otherwise({
      redirectTo: '/'
    });

}]);

// controller for the home page
angularBlogDemo.controller('HomeController', ['$scope', 'BlogInfoService', 'PostService', function($scope, BlogInfoService, PostService) {

  BlogInfoService.getBlogInfo()
    .then(function(blogInfo) {
      $scope.title = blogInfo.title;
      $scope.description = blogInfo.description;
    });

  PostService.getLatestPosts()
    .then(function(posts) {
      $scope.latest_posts = posts;
    });
  
}]);

// controller for the posts page
angularBlogDemo.controller('PostController', ['$scope', '$routeParams', 'PostService', function($scope, $routeParams, PostService) {

  $scope.post_id = $routeParams.id;

  PostService.getPostById($scope.post_id)
    .then(function(post) {
      $scope.post = post;
    });
}]);

// a service for getting the blog info
angularBlogDemo.factory('BlogInfoService', ['$http', '$q', function($http, $q) {

  return {
    getBlogInfo: function() {
      return $http.get('/api/get_blog_info.json')
        .then(function(response) {
          if (response.data) {
            return response.data;
          } else {
            return $q.reject('No data in response.');
          }
        }, function(response) {
          return $q.reject('Server or connection error.');
        });
    }
  };

}]);

// a service for getting posts
angularBlogDemo.factory('PostService', ['$http', '$q', function($http, $q) {

  // post data structures
  var post_list = [],
      posts_by_id = {};

  function loadPosts(posts) {
    post_list = [];
    angular.forEach(posts, function(post) {
      post_list.push(post);
      if (typeof post.id !== 'undefined') {
        posts_by_id[post.id] = post;
      }
    });
  }

  function fetchLatestPosts() {
    return $http.get('/api/get_posts.json')
      .then(function(response) {
        if (response.data && response.data.posts) {
          loadPosts(response.data.posts);
          return response.data.posts;
        } else {
          return $q.reject('No data in response.');
        }
      }, function(response) {
        return $q.reject('Server or connection error.');
      });
  }

  return {

    getPostById: function(id) {
      var deferred = $q.defer();
      
      if (posts_by_id.hasOwnProperty(id)) {
        deferred.resolve(posts_by_id[id]);
      } else {
        fetchLatestPosts()
          .then(function(posts){
            deferred.resolve(posts_by_id[id]);
          }, function(msg) {
            deferred.reject(msg);
          });
      }
      
      return deferred.promise;
    },

    getLatestPosts: function() {
      var deferred = $q.defer();
      
      if (post_list.length) {
        deferred.resolve(post_list);
      } else {
        fetchLatestPosts()
          .then(function(posts){
            deferred.resolve(posts);
          }, function(msg) {
            deferred.reject(msg);
          });
      }
      
      return deferred.promise;
    }
  };

}]);