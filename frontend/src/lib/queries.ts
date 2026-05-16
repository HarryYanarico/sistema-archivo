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

export const GET_ALL_PERSONAS = gql`
  query GetAllPersonas {
    allPersonas {
      id
      ci
      nombre
      apellido
      telefono
      email
      direccion
      fechaNaci
      cargo
    }
  }
`;

export const CREAR_PERSONA = gql`
  mutation CrearPersona($ci: String!, $nombre: String!, $apellido: String!, $telefono: String, $email: String, $direccion: String, $fechaNaci: Date, $cargo: String) {
    crearPersona(ci: $ci, nombre: $nombre, apellido: $apellido, telefono: $telefono, email: $email, direccion: $direccion, fechaNaci: $fechaNaci, cargo: $cargo) {
      persona {
        id
        ci
        nombre
        apellido
        telefono
        email
        direccion
        fechaNaci
        cargo
      }
      success
      error
    }
  }
`;

export const GET_ALL_AMBIENTES = gql`
  query GetAllAmbientes {
    allAmbientes {
      id
      nombre
      ubicacion
      descripcion
    }
  }
`;

export const GET_ALL_ESTANTES = gql`
  query GetAllEstantes {
    allEstantes {
      id
      codigo
      numero
      descripcion
      estado
      ambiente {
        id
        nombre
      }
    }
  }
`;

export const GET_ALL_PISOS = gql`
  query GetAllPisos {
    allPisos {
      id
      nroFila
      descripcion
      capacidadMax
      estante {
        id
        codigo
      }
    }
  }
`;

export const GET_ALL_CARPETAS = gql`
  query GetAllCarpetas {
    allCarpetas {
      id
      descripcion
      fechaCrea
      estado
      piso {
        id
        nroFila
        estante {
          id
          codigo
          ambiente {
            id
            nombre
          }
        }
      }
    }
  }
`;

export const CREAR_AMBIENTE = gql`
  mutation CrearAmbiente($nombre: String!, $ubicacion: String, $descripcion: String) {
    crearAmbiente(nombre: $nombre, ubicacion: $ubicacion, descripcion: $descripcion) {
      ambiente {
        id
        nombre
        ubicacion
        descripcion
      }
      success
      error
    }
  }
`;

export const CREAR_ESTANTE = gql`
  mutation CrearEstante($codigo: String!, $idAmbiente: ID!, $numero: Int, $descripcion: String, $estado: String) {
    crearEstante(codigo: $codigo, idAmbiente: $idAmbiente, numero: $numero, descripcion: $descripcion, estado: $estado) {
      estante {
        id
        codigo
        numero
        descripcion
        estado
        ambiente {
          id
          nombre
        }
      }
      success
      error
    }
  }
`;

export const CREAR_PISO = gql`
  mutation CrearPiso($nroFila: Int!, $idEstante: ID!, $descripcion: String, $capacidadMax: Int) {
    crearPiso(nroFila: $nroFila, idEstante: $idEstante, descripcion: $descripcion, capacidadMax: $capacidadMax) {
      piso {
        id
        nroFila
        descripcion
        capacidadMax
        estante {
          id
          codigo
        }
      }
      success
      error
    }
  }
`;

export const CREAR_CARPETA = gql`
  mutation CrearCarpeta($descripcion: String!, $idPiso: ID!) {
    crearCarpeta(descripcion: $descripcion, idPiso: $idPiso) {
      carpeta {
        id
        descripcion
        fechaCrea
        estado
        piso {
          id
          nroFila
        }
      }
      success
      error
    }
  }
`;

export const REGISTRAR_PRESTAMO = gql`
  mutation RegistrarPrestamo($idsCarpetas: [ID]!, $idPersona: ID!, $fechaLimite: Date!, $idAutorizadoPor: ID!, $observaciones: String) {
    registrarPrestamo(idsCarpetas: $idsCarpetas, idPersona: $idPersona, fechaLimite: $fechaLimite, idAutorizadoPor: $idAutorizadoPor, observaciones: $observaciones) {
      prestamo {
        id
        fechaPrest
        fechaLimite
        observaciones
        persona {
          id
          ci
          nombre
          apellido
        }
        usuario {
          id
          username
        }
        carpetas {
          id
          descripcion
        }
      }
      success
      error
    }
  }
`;

export const REGISTRAR_DEVOLUCION = gql`
  mutation RegistrarDevolucion($idPrestamoCarpeta: ID!, $observaciones: String) {
    registrarDevolucion(idPrestamoCarpeta: $idPrestamoCarpeta, observaciones: $observaciones) {
      devolucion {
        id
        fechaDevol
        observaciones
        usuario {
          id
          username
        }
        prestamoCarpeta {
          id
          carpeta {
            id
            descripcion
          }
        }
      }
      success
      error
    }
  }
`;

export const GET_ALL_DEVOLUCIONES = gql`
  query GetAllDevoluciones {
    allDevoluciones {
      id
      fechaDevol
      observaciones
      usuario {
        id
        username
        firstName
        lastName
      }
      prestamoCarpeta {
        id
        carpeta {
          id
          descripcion
        }
      }
    }
  }
`;

export const GET_ALL_PRESTAMOS = gql`
  query GetAllPrestamos {
    allPrestamos {
      id
      fechaPrest
      fechaLimite
      observaciones
      persona {
        id
        ci
        nombre
        apellido
        telefono
        email
        direccion
      }
      usuario {
        id
        username
        firstName
        lastName
      }
      autorizadoPor {
        id
        ci
        nombre
        apellido
        cargo
      }
      carpetas {
        id
        descripcion
        estado
        piso {
          id
          nroFila
          descripcion
          estante {
            id
            codigo
            ambiente {
              id
              nombre
            }
          }
        }
      }
      prestamoCarpetas {
        id
        estado
        fechaDevol
        observaciones
        carpeta {
          id
          descripcion
          estado
        }
      }
    }
  }
`;
