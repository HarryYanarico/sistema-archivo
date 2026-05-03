import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation TokenAuth($username: String!, $password: String!) {
    tokenAuth(username: $username, password: $password) {
      token
      payload
    }
  }
`;

export const GET_ME = gql`
  query GetMe {
    me {
      id
      username
      firstName
      lastName
      email
      isActive
      permissionsList
      groups {
        id
        name
      }
    }
  }
`;

export const GET_ALL_USERS = gql`
  query GetAllUsers {
    allUsers {
      id
      username
      firstName
      lastName
      email
      isActive
      dateJoined
      permissionsList
      groups {
        id
        name
      }
    }
  }
`;

export const GET_ALL_GROUPS = gql`
  query GetAllGroups {
    allGroups {
      id
      name
      permissions {
        id
        codename
        name
        contentTypeModel
      }
    }
  }
`;

export const GET_ALL_PERMISSIONS = gql`
  query GetAllPermissions {
    allPermissions {
      id
      codename
      name
      contentTypeModel
    }
  }
`;

export const CREATE_USER = gql`
  mutation CreateUser($username: String!, $password: String!, $firstName: String!, $lastName: String!, $email: String, $groupId: ID, $permissionIds: [ID]) {
    createUser(username: $username, password: $password, firstName: $firstName, lastName: $lastName, email: $email, groupId: $groupId, permissionIds: $permissionIds) {
      user {
        id
        username
        firstName
        lastName
        email
        isActive
        permissionsList
        groups {
          id
          name
        }
      }
      success
      error
    }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($userId: ID!, $firstName: String, $lastName: String, $email: String, $isActive: Boolean, $groupId: ID, $permissionIds: [ID]) {
    updateUser(userId: $userId, firstName: $firstName, lastName: $lastName, email: $email, isActive: $isActive, groupId: $groupId, permissionIds: $permissionIds) {
      user {
        id
        username
        firstName
        lastName
        email
        isActive
        permissionsList
        groups {
          id
          name
        }
      }
      success
      error
    }
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($userId: ID!) {
    deleteUser(userId: $userId) {
      success
      error
    }
  }
`;
