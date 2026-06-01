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
      isSuperuser
      permissionsList
      ambientesAsignados
      sessionInvalidatedAt
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
      directPermissionIds
      ambientesAsignados
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
      }
    }
  }
`;

export const GENERATE_RESET_CODE = gql`
  mutation GenerateResetCode($userId: ID!) {
    generateResetCode(userId: $userId) {
      success
      code
      error
    }
  }
`;

export const VERIFY_RESET_CODE = gql`
  mutation VerifyResetCode($username: String!, $code: String!) {
    verifyResetCode(username: $username, code: $code) {
      success
      error
    }
  }
`;

export const SET_NEW_PASSWORD = gql`
  mutation SetNewPassword($username: String!, $code: String!, $newPassword: String!) {
    setNewPassword(username: $username, code: $code, newPassword: $newPassword) {
      success
      error
    }
  }
`;

export const GET_ALL_BLOQUEOS = gql`
  query GetAllBloqueos {
    allBloqueos {
      id
      fechaBloq
      motivoBloq
      fechaDesbloq
      usuario {
        id
        username
        firstName
        lastName
      }
      persona {
        id
        ci
        nombre
        apellido
      }
    }
  }
`;

export const CREAR_BLOQUEO = gql`
  mutation CrearBloqueo($personaId: ID!, $motivo: String!) {
    crearBloqueo(personaId: $personaId, motivo: $motivo) {
      bloqueo {
        id
        fechaBloq
        motivoBloq
        persona {
          id
          nombre
          apellido
        }
      }
      success
      error
    }
  }
`;

export const DESBLOQUEAR_PERSONA = gql`
  mutation DesbloquearPersona($bloqueoId: ID!) {
    desbloquearPersona(bloqueoId: $bloqueoId) {
      bloqueo {
        id
        fechaDesbloq
        motivoBloq
        persona {
          id
          nombre
          apellido
        }
      }
      success
      error
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

export const RESET_USER_2FA = gql`
  mutation ResetUser2FA($userId: ID!) {
    resetUser2fa(userId: $userId) {
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

export const FORZAR_CIERRE_SESION = gql`
  mutation ForzarCierreSesion($userId: ID!) {
    forzarCierreSesion(userId: $userId) {
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

export const ACTUALIZAR_PERSONA = gql`
  mutation ActualizarPersona($id: ID!, $ci: String, $nombre: String, $apellido: String, $telefono: String, $email: String, $direccion: String, $fechaNaci: Date, $cargo: String) {
    actualizarPersona(id: $id, ci: $ci, nombre: $nombre, apellido: $apellido, telefono: $telefono, email: $email, direccion: $direccion, fechaNaci: $fechaNaci, cargo: $cargo) {
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
      limitePisos
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

export const EDITAR_AMBIENTE = gql`
  mutation EditarAmbiente($id: ID!, $nombre: String, $ubicacion: String, $descripcion: String) {
    editarAmbiente(id: $id, nombre: $nombre, ubicacion: $ubicacion, descripcion: $descripcion) {
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
  mutation CrearEstante($codigo: String!, $idAmbiente: ID!, $numero: Int, $descripcion: String, $estado: String, $limitePisos: Int) {
    crearEstante(codigo: $codigo, idAmbiente: $idAmbiente, numero: $numero, descripcion: $descripcion, estado: $estado, limitePisos: $limitePisos) {
      estante {
        id
        codigo
        numero
        descripcion
        estado
        limitePisos
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
  mutation CrearPiso($nroFila: Int!, $idEstante: ID!, $descripcion: String) {
    crearPiso(nroFila: $nroFila, idEstante: $idEstante, descripcion: $descripcion) {
      piso {
        id
        nroFila
        descripcion
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

export const EDITAR_ESTANTE = gql`
  mutation EditarEstante($id: ID!, $codigo: String, $numero: Int, $descripcion: String, $estado: String, $limitePisos: Int, $idAmbiente: ID) {
    editarEstante(id: $id, codigo: $codigo, numero: $numero, descripcion: $descripcion, estado: $estado, limitePisos: $limitePisos, idAmbiente: $idAmbiente) {
      estante {
        id
        codigo
        numero
        descripcion
        estado
        limitePisos
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

export const EDITAR_PISO = gql`
  mutation EditarPiso($id: ID!, $nroFila: Int, $descripcion: String, $idEstante: ID) {
    editarPiso(id: $id, nroFila: $nroFila, descripcion: $descripcion, idEstante: $idEstante) {
      piso {
        id
        nroFila
        descripcion
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

export const EDITAR_CARPETA = gql`
  mutation EditarCarpeta($id: ID!, $descripcion: String, $estado: String, $idPiso: ID) {
    editarCarpeta(id: $id, descripcion: $descripcion, estado: $estado, idPiso: $idPiso) {
      carpeta {
        id
        descripcion
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
  mutation RegistrarDevolucion($idPrestamoCarpeta: ID!, $observaciones: String, $estadoDevolucion: String, $bloquearPersona: Boolean) {
    registrarDevolucion(idPrestamoCarpeta: $idPrestamoCarpeta, observaciones: $observaciones, estadoDevolucion: $estadoDevolucion, bloquearPersona: $bloquearPersona) {
      devolucion {
        id
        fechaDevol
        observaciones
        estadoDevolucion
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

export const GET_MIS_AMBIENTES = gql`
  query GetMisAmbientes {
    misAmbientes {
      id
      nombre
      ubicacion
      descripcion
    }
  }
`;

export const GET_ALL_TRASPASOS = gql`
  query GetAllTraspasos {
    allTraspasos {
      id
      fecha
      observaciones
      ubicado
      usuario {
        id
        username
        firstName
        lastName
      }
      ambienteOrigen {
        id
        nombre
      }
      ambienteDestino {
        id
        nombre
      }
      items {
        id
        ubicado
        pisoAsignado {
          id
          nroFila
          estante {
            codigo
          }
        }
        carpeta {
          id
          descripcion
          estado
        }
      }
    }
  }
`;

export const ASIGNAR_AMBIENTES = gql`
  mutation AsignarAmbientes($usuarioId: ID!, $idsAmbientes: [ID]!) {
    asignarAmbientes(usuarioId: $usuarioId, idsAmbientes: $idsAmbientes) {
      success
      error
    }
  }
`;

export const REGISTRAR_TRASPASO = gql`
  mutation RegistrarTraspaso($idsCarpetas: [ID]!, $idAmbienteOrigen: ID!, $idAmbienteDestino: ID!, $observaciones: String) {
    registrarTraspaso(idsCarpetas: $idsCarpetas, idAmbienteOrigen: $idAmbienteOrigen, idAmbienteDestino: $idAmbienteDestino, observaciones: $observaciones) {
      traspaso {
        id
        fecha
      }
      success
      error
    }
  }
`;

export const UBICAR_CARPETAS = gql`
  mutation UbicarCarpetas($idsTraspasoCarpeta: [ID]!, $idPiso: ID!) {
    ubicarCarpetas(idsTraspasoCarpeta: $idsTraspasoCarpeta, idPiso: $idPiso) {
      success
      error
    }
  }
`;

export const GET_ALL_CARPETAS_DETALLE = gql`
  query GetAllCarpetasDetalle {
    allCarpetas {
      id
      descripcion
      fechaCrea
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
            ubicacion
          }
        }
      }
      documentos {
        id
        codigoDoc
        titulo
        tipoDoc
        fechaIngre
        propietario
      }
    }
  }
`;

export const CREAR_DOCUMENTO = gql`
  mutation CrearDocumento($codigoDoc: String!, $titulo: String!, $tipoDoc: String!, $idCarpeta: ID!, $propietario: String) {
    crearDocumento(codigoDoc: $codigoDoc, titulo: $titulo, tipoDoc: $tipoDoc, idCarpeta: $idCarpeta, propietario: $propietario) {
      documento {
        id
        codigoDoc
        titulo
        tipoDoc
        fechaIngre
        propietario
      }
      success
      error
    }
  }
`;

export const EDITAR_DOCUMENTO = gql`
  mutation EditarDocumento($id: ID!, $codigoDoc: String, $titulo: String, $tipoDoc: String, $propietario: String) {
    editarDocumento(id: $id, codigoDoc: $codigoDoc, titulo: $titulo, tipoDoc: $tipoDoc, propietario: $propietario) {
      documento {
        id
        codigoDoc
        titulo
        tipoDoc
        propietario
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

export const GET_ALL_DEVOLUCIONES_PAGINATED = gql`
  query GetAllDevolucionesPaginated($page: Int, $pageSize: Int) {
    allDevolucionesPaginated(page: $page, pageSize: $pageSize) {
      items {
        id
        fechaDevol
        observaciones
        estadoDevolucion
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
            piso {
              nroFila
              descripcion
              estante {
                codigo
                ambiente {
                  nombre
                }
              }
            }
          }
          prestamo {
            id
            fechaPrest
            fechaLimite
            observaciones
            persona {
              id
              nombre
              apellido
              ci
              telefono
              email
            }
            usuario {
              id
              username
              firstName
              lastName
            }
            autorizadoPor {
              id
              nombre
              apellido
              cargo
            }
          }
        }
      }
      totalCount
    }
  }
`;

export const GET_ALL_INCIDENTES = gql`
  query GetAllIncidentes {
    allIncidentes {
      id
      tipoInci
      fechaReporte
      estado
      usuario {
        id
        username
        firstName
        lastName
      }
      detalles {
        id
        descripcion
        carpeta {
          id
          descripcion
        }
      }
    }
  }
`;

export const GET_ALL_INCIDENTES_PAGINATED = gql`
  query GetAllIncidentesPaginated($page: Int, $pageSize: Int) {
    allIncidentesPaginated(page: $page, pageSize: $pageSize) {
      items {
        id
        tipoInci
        fechaReporte
        estado
        usuario {
          id
          username
          firstName
          lastName
        }
        detalles {
          id
          descripcion
          carpeta {
            id
            descripcion
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
      }
      totalCount
    }
  }
`;

export const REGISTRAR_INCIDENTE = gql`
  mutation RegistrarIncidente($tipoInci: String!, $carpetaIds: [ID]!, $descripcion: String) {
    crearIncidente(tipoInci: $tipoInci, carpetaIds: $carpetaIds, descripcion: $descripcion) {
      incidente {
        id
        tipoInci
        fechaReporte
        estado
        usuario {
          id
          username
        }
      }
      success
      error
    }
  }
`;

export const RESOLVER_INCIDENTE = gql`
  mutation ResolverIncidente($incidenteId: ID!) {
    resolverIncidente(incidenteId: $incidenteId) {
      success
      error
    }
  }
`;

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      totalCarpetas
      prestamosActivos
      prestamosVencidosCount
      carpetasDisponibles
      personasCount
      traspasosPendientes
      incidentesActivos
      carpetasPorAmbiente {
        ambienteId
        ambienteNombre
        count
      }
      prestamosRecientes {
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
          firstName
          lastName
        }
        carpetas {
          id
          descripcion
          estado
        }
        prestamoCarpetas {
          id
          estado
          fechaDevol
        }
      }
      prestamosPorVencer {
        id
        fechaPrest
        fechaLimite
        persona {
          id
          nombre
          apellido
        }
        carpetas {
          id
          descripcion
        }
      }
      devolucionesRecientes {
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
  }
`;

export const GET_NOTIFICATIONS = gql`
  query GetNotifications {
    notifications {
      id
      tipo
      mensaje
      link
      fecha
    }
  }
`;

export const GET_ALL_CARPETAS_PAGINATED = gql`
  query GetAllCarpetasPaginated($page: Int, $pageSize: Int, $ambienteId: String, $search: String) {
    allCarpetasPaginated(page: $page, pageSize: $pageSize, ambienteId: $ambienteId, search: $search) {
      items {
        id
        descripcion
        fechaCrea
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
              ubicacion
            }
          }
        }
        documentos {
          id
          codigoDoc
          titulo
          tipoDoc
          fechaIngre
          propietario
        }
      }
      totalCount
    }
  }
`;

export const GET_ALL_CARPETAS_SIMPLE_PAGINATED = gql`
  query GetAllCarpetasSimplePaginated($page: Int, $pageSize: Int, $ambienteId: String) {
    allCarpetasPaginated(page: $page, pageSize: $pageSize, ambienteId: $ambienteId) {
      items {
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
      totalCount
    }
  }
`;

export const GET_ALL_PERSONAS_PAGINATED = gql`
  query GetAllPersonasPaginated($page: Int, $pageSize: Int, $search: String) {
    allPersonasPaginated(page: $page, pageSize: $pageSize, search: $search) {
      items {
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
      totalCount
    }
  }
`;

export const GET_ALL_PRESTAMOS_PAGINATED = gql`
  query GetAllPrestamosPaginated($page: Int, $pageSize: Int) {
    allPrestamosPaginated(page: $page, pageSize: $pageSize) {
      items {
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
          firstName
          lastName
        }
        autorizadoPor {
          id
          nombre
          apellido
          cargo
        }
        carpetas {
          id
          descripcion
          estado
        }
        prestamoCarpetas {
          id
          estado
          carpeta {
            id
            descripcion
          }
        }
      }
      totalCount
    }
  }
`;

export const GET_PRESTAMO_CARPETAS_PAGINATED = gql`
  query GetPrestamoCarpetasPaginated($prestamoId: ID!, $page: Int, $pageSize: Int) {
    prestamoCarpetasPaginated(prestamoId: $prestamoId, page: $page, pageSize: $pageSize) {
      items {
        id
        estado
        fechaDevol
        observaciones
        carpeta {
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
      }
      totalCount
    }
  }
`;

export const GET_ALL_PRESTAMOS_VENCIDOS_PAGINATED = gql`
  query GetAllPrestamosVencidosPaginated($page: Int, $pageSize: Int) {
    allPrestamosVencidosPaginated(page: $page, pageSize: $pageSize) {
      items {
        id
        fechaPrest
        fechaLimite
        persona {
          id
          ci
          nombre
          apellido
        }
        carpetas {
          id
          descripcion
        }
      }
      totalCount
    }
  }
`;

export const GET_ALL_PRESTAMOS_ACTIVOS_PAGINATED = gql`
  query GetAllPrestamosActivosPaginated($page: Int, $pageSize: Int) {
    allPrestamosActivosPaginated(page: $page, pageSize: $pageSize) {
      items {
        id
        fechaPrest
        fechaLimite
        persona {
          id
          nombre
          apellido
        }
        prestamoCarpetas {
          id
          estado
          carpeta {
            id
            descripcion
          }
        }
      }
      totalCount
    }
  }
`;

export const GET_ALL_TRASPASOS_PAGINATED = gql`
  query GetAllTraspasosPaginated($page: Int, $pageSize: Int) {
    allTraspasosPaginated(page: $page, pageSize: $pageSize) {
      items {
        id
        fecha
        observaciones
        ubicado
        usuario {
          id
          username
          firstName
          lastName
        }
        ambienteOrigen {
          id
          nombre
        }
        ambienteDestino {
          id
          nombre
        }
        items {
          id
          ubicado
          pisoAsignado {
            id
            nroFila
            estante {
              codigo
            }
          }
          carpeta {
            id
            descripcion
            estado
          }
        }
      }
      totalCount
    }
  }
`;

export const GET_ALL_USERS_PAGINATED = gql`
  query GetAllUsersPaginated($page: Int, $pageSize: Int, $search: String) {
    allUsersPaginated(page: $page, pageSize: $pageSize, search: $search) {
      items {
        id
        username
        firstName
        lastName
        email
        isActive
        dateJoined
        permissionsList
        directPermissionIds
        ambientesAsignados
        groups {
          id
          name
        }
      }
      totalCount
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

export const GET_ALL_PRORROGAS_PAGINATED = gql`
  query GetAllProrrogasPaginated($page: Int, $pageSize: Int) {
    allProrrogasPaginated(page: $page, pageSize: $pageSize) {
      items {
        id
        fechaRegistro
        diasOtorgados
        motivo
        usuario {
          id
          username
          firstName
          lastName
        }
        personaSolicita {
          id
          nombre
          apellido
          ci
        }
        prestamo {
          id
          fechaPrest
          fechaLimite
          persona {
            id
            nombre
            apellido
            ci
          }
        }
      }
      totalCount
    }
  }
`;

export const ACTUALIZAR_PERFIL = gql`
  mutation ActualizarPerfil($firstName: String, $lastName: String, $currentPassword: String, $newPassword: String) {
    actualizarPerfil(firstName: $firstName, lastName: $lastName, currentPassword: $currentPassword, newPassword: $newPassword) {
      user {
        id
        firstName
        lastName
      }
      success
      error
    }
  }
`;

export const REGISTRAR_PRORROGA = gql`
  mutation RegistrarProrroga($prestamoId: ID!, $personaSolicitaId: ID!, $diasOtorgados: Int!, $motivo: String) {
    registrarProrroga(prestamoId: $prestamoId, personaSolicitaId: $personaSolicitaId, diasOtorgados: $diasOtorgados, motivo: $motivo) {
      prorroga {
        id
        fechaRegistro
        diasOtorgados
      }
      success
      error
    }
  }
`;
