import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client/react';
import { useSearchParams } from 'react-router-dom';
import { GET_ALL_CARPETAS_PAGINATED, GET_ALL_AMBIENTES, GET_ALL_PRESTAMOS, CREAR_DOCUMENTO, EDITAR_CARPETA, EDITAR_DOCUMENTO, GET_ALL_PERSONAS_PAGINATED } from '../lib/queries';
import { Search, Filter, FolderOpen, FileText, X, Pencil, Plus, UserCheck } from 'lucide-react';
import Pagination from '../components/Pagination';
import { usePermission } from '../context/AuthContext';

type Ambiente = { id: string; nombre: string; ubicacion?: string };
type Documento = { id: string; codigoDoc: string; titulo: string; tipoDoc: string; fechaIngre: string; propietario?: string };
type Carpeta = {
  id: string; descripcion: string; fechaCrea: string; estado: string;
  piso: {
    id: string; nroFila: number; descripcion?: string;
    estante: { id: string; codigo: string; ambiente: { id: string; nombre: string; ubicacion?: string } };
  };
  documentos: Documento[];
};

export default function CarpetasPage() {
  const [searchParams] = useSearchParams();
  const [selectedAmbienteId, setSelectedAmbienteId] = useState('');
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedCarpeta, setSelectedCarpeta] = useState<Carpeta | null>(null);
  const [showDocForm, setShowDocForm] = useState(false);
  const [docCodigo, setDocCodigo] = useState('');
  const [DocTitulo, setDocTitulo] = useState('');
  const [docTipo, setDocTipo] = useState('');
  const [docPropietario, setDocPropietario] = useState('');
  const [docError, setDocError] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);
  const [personaSearch, setPersonaSearch] = useState('');
  const [personaResults, setPersonaResults] = useState<{ id: string; nombre: string; apellido: string; ci: string }[]>([]);
  const [showPersonaDropdown, setShowPersonaDropdown] = useState(false);
  const personaDebounce = useRef<ReturnType<typeof setTimeout>>();
  const personaRef = useRef<HTMLDivElement>(null);

  const [buscarPersonas] = useLazyQuery(GET_ALL_PERSONAS_PAGINATED, { fetchPolicy: 'network-only' });

  const { data: carpetasData, loading, refetch } = useQuery(GET_ALL_CARPETAS_PAGINATED, {
    variables: { page: currentPage, pageSize: itemsPerPage, ambienteId: selectedAmbienteId || undefined, search: search || undefined },
    fetchPolicy: 'network-only',
  });
  const { data: ambData } = useQuery(GET_ALL_AMBIENTES);
  const { data: prestamosData } = useQuery(GET_ALL_PRESTAMOS);
  const [editingDoc, setEditingDoc] = useState<Documento | null>(null);
  const [editDocCodigo, setEditDocCodigo] = useState('');
  const [editDocTitulo, setEditDocTitulo] = useState('');
  const [editDocTipo, setEditDocTipo] = useState('');
  const [editDocPropietario, setEditDocPropietario] = useState('');
  const [editDocError, setEditDocError] = useState('');

  const [crearDocumento] = useMutation(CREAR_DOCUMENTO);
  const [editarDocumento] = useMutation(EDITAR_DOCUMENTO);
  const [editarCarpeta] = useMutation(EDITAR_CARPETA);
  const { hasPerm } = usePermission();

  useEffect(() => {
    if (selectedCarpeta) {
      setEditDescripcion(selectedCarpeta.descripcion);
      setEditError('');
      setShowDocForm(false);
    }
  }, [selectedCarpeta]);

  const ambientes = (ambData?.allAmbientes ?? []) as Ambiente[];
  const carpetas = (carpetasData?.allCarpetasPaginated?.items ?? []) as Carpeta[];
  const totalCount = carpetasData?.allCarpetasPaginated?.totalCount ?? 0;
  const prestamos = (prestamosData?.allPrestamos ?? []) as {
    id: string; fechaPrest: string; fechaLimite: string; persona: { nombre: string; apellido: string; ci: string };
    prestamoCarpetas: { id: string; carpeta: { id: string } }[];
  }[];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (personaRef.current && !personaRef.current.contains(e.target as Node)) {
        setShowPersonaDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePersonaSearch = (value: string) => {
    setDocPropietario(value);
    setPersonaSearch(value);
    if (personaDebounce.current) clearTimeout(personaDebounce.current);
    if (value.trim().length < 2) { setPersonaResults([]); setShowPersonaDropdown(false); return; }
    personaDebounce.current = setTimeout(async () => {
      try {
        const { data } = await buscarPersonas({ variables: { page: 1, pageSize: 8, search: value.trim() } });
        const items = data?.allPersonasPaginated?.items ?? [];
        setPersonaResults(items);
        setShowPersonaDropdown(items.length > 0);
      } catch { setPersonaResults([]); }
    }, 350);
  };

  const selectPersona = (p: { nombre: string; apellido: string }) => {
    setDocPropietario(`${p.nombre} ${p.apellido}`);
    setPersonaSearch('');
    setPersonaResults([]);
    setShowPersonaDropdown(false);
  };

  const historialCarpeta = selectedCarpeta
    ? prestamos.filter((p) =>
        p.prestamoCarpetas?.some((pc) => pc.carpeta.id === selectedCarpeta.id)
      )
    : [];

  const openEditDoc = (doc: Documento) => {
    setEditingDoc(doc);
    setEditDocCodigo(doc.codigoDoc);
    setEditDocTitulo(doc.titulo);
    setEditDocTipo(doc.tipoDoc);
    setEditDocPropietario(doc.propietario ?? '');
    setEditDocError('');
  };

  const closeEditDoc = () => {
    setEditingDoc(null);
    setEditDocError('');
  };

  const handleEditDoc = async () => {
    setEditDocError('');
    if (!editDocCodigo || !editDocTitulo || !editDocTipo) {
      setEditDocError('Código, título y tipo son obligatorios');
      return;
    }
    try {
      const vars: Record<string, unknown> = { id: editingDoc!.id, codigoDoc: editDocCodigo, titulo: editDocTitulo, tipoDoc: editDocTipo };
      if (editDocPropietario) vars.propietario = editDocPropietario;
      const { data } = await editarDocumento({ variables: vars });
      if (data?.editarDocumento?.error) throw new Error(data.editarDocumento.error);
      closeEditDoc();
      refetch();
    } catch (err: unknown) {
      setEditDocError(err instanceof Error ? err.message : 'Error al editar documento');
    }
  };

  const handleCrearDocumento = async () => {
    setDocError('');
    if (!docCodigo || !DocTitulo || !docTipo) {
      setDocError('Código, título y tipo son obligatorios');
      return;
    }
    try {
      const { data } = await crearDocumento({
        variables: { codigoDoc: docCodigo, titulo: DocTitulo, tipoDoc: docTipo, idCarpeta: selectedCarpeta!.id, propietario: docPropietario || undefined },
      });
      if (data?.crearDocumento?.error) throw new Error(data.crearDocumento.error);
      setShowDocForm(false);
      setDocCodigo('');
      setDocTitulo('');
      setDocTipo('');
      setDocPropietario('');
      refetch();
    } catch (err: unknown) {
      setDocError(err instanceof Error ? err.message : 'Error al crear documento');
    }
  };

  const openDocForm = () => {
    setDocCodigo('');
    setDocTitulo('');
    setDocTipo('');
    setDocPropietario('');
    setDocError('');
    setShowDocForm(true);
  };

  const handleGuardarEdicion = async () => {
    setEditError('');
    setSaving(true);
    try {
      const { data } = await editarCarpeta({
        variables: { id: selectedCarpeta!.id, descripcion: editDescripcion },
      });
      if (data?.editarCarpeta?.error) throw new Error(data.editarCarpeta.error);
      refetch();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const cerrarModal = () => {
    setSelectedCarpeta(null);
    setShowDocForm(false);
    setEditError('');
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-surface-800 dark:text-sepia-200">Carpetas</h2>
      </div>

      <div className="glass-panel rounded-2xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Filter size={16} className="text-surface-500 dark:text-sepia-500 shrink-0" />
            <select value={selectedAmbienteId} onChange={(e) => { setSelectedAmbienteId(e.target.value); setCurrentPage(1); }}
              className="w-full max-w-xs px-4 py-2.5 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 transition-all text-sm"
            >
              <option value="">Todos los ambientes</option>
              {ambientes.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 dark:text-sepia-500" size={16} />
            <input type="text" placeholder="Buscar carpeta por descripción..." value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 placeholder:text-surface-500 dark:placeholder:text-sepia-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 transition-all text-sm"
            />
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-2xl flex flex-col" style={{ maxHeight: 'calc(100vh - 210px)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/20 dark:border-sepia-700/30 shrink-0">
          <h3 className="text-lg font-bold text-surface-800 dark:text-sepia-200">Todas las Carpetas</h3>
          <span className="text-sm text-surface-600 dark:text-sepia-500">{totalCount} resultado(s)</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-surface-500 dark:text-sepia-500">
            <p className="text-lg font-medium">Cargando...</p>
          </div>
        ) : <>
          <div className="overflow-auto flex-1">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20 dark:border-sepia-700/30">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-surface-600 dark:text-sepia-500 uppercase sticky top-0 bg-white/95 dark:bg-sepia-900/95 backdrop-blur-sm z-10">Descripción</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-surface-600 dark:text-sepia-500 uppercase sticky top-0 bg-white/95 dark:bg-sepia-900/95 backdrop-blur-sm z-10">Ubicación</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-surface-600 dark:text-sepia-500 uppercase sticky top-0 bg-white/95 dark:bg-sepia-900/95 backdrop-blur-sm z-10">Estado</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-surface-600 dark:text-sepia-500 uppercase sticky top-0 bg-white/95 dark:bg-sepia-900/95 backdrop-blur-sm z-10">Documentos</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-surface-600 dark:text-sepia-500 uppercase sticky top-0 bg-white/95 dark:bg-sepia-900/95 backdrop-blur-sm z-10">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 dark:divide-sepia-700/20">
                {carpetas.map((c) => (
                  <tr key={c.id} className="hover:bg-white/30 dark:hover:bg-sepia-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-surface-800 dark:text-sepia-200">{c.descripcion}</td>
                    <td className="px-6 py-4 text-sm text-surface-600 dark:text-sepia-400">
                      {c.piso.estante.ambiente.nombre} / {c.piso.estante.codigo} / Fila {c.piso.nroFila}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        c.estado === 'disponible' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                      }`}>
                        {c.estado === 'disponible' ? 'Disponible' : 'Prestado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-sm text-surface-600 dark:text-sepia-400">
                        <FileText size={14} />
                        {c.documentos?.length ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {hasPerm('gestionar_carpetas') && (
                        <button onClick={() => setSelectedCarpeta(c)}
                          className="p-2 rounded-lg text-surface-500 dark:text-sepia-500 hover:text-brand-600 dark:hover:text-brand-dark-400 hover:bg-brand-50 dark:hover:bg-brand-dark-600/20 transition-colors"
                          title="Editar carpeta"
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalCount === 0 && (
              <div className="text-center py-12 text-surface-500 dark:text-sepia-500">
                <FolderOpen size={40} className="mx-auto mb-2 opacity-40 dark:opacity-60" />
                <p className="text-sm font-medium">No hay carpetas</p>
              </div>
            )}
          </div>
          <div className="shrink-0 border-t border-white/20 dark:border-sepia-700/30">
            <Pagination currentPage={currentPage} totalItems={totalCount} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
          </div>
        </>}
      </div>

      {selectedCarpeta && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 dark:bg-black/70 backdrop-blur-sm p-4 pt-12">
          <div className="glass-panel rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-surface-800 dark:text-sepia-200">Editar Carpeta</h3>
              <button onClick={cerrarModal}
                className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4 pb-4 border-b border-white/10 dark:border-sepia-700/20">
              <div className="flex items-center gap-2">
                <span className="text-xs text-surface-500 dark:text-sepia-500">Estado:</span>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  selectedCarpeta.estado === 'disponible' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                }`}>
                  {selectedCarpeta.estado === 'disponible' ? 'Disponible' : 'Prestado'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-surface-500 dark:text-sepia-500">Creada:</span>
                <span className="text-sm font-medium text-surface-700 dark:text-sepia-300">{selectedCarpeta.fechaCrea}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-surface-500 dark:text-sepia-500">Ubicación:</span>
                <span className="text-sm font-medium text-surface-700 dark:text-sepia-300">
                  {selectedCarpeta.piso.estante.ambiente.nombre} / {selectedCarpeta.piso.estante.codigo} / Fila {selectedCarpeta.piso.nroFila}
                </span>
              </div>
            </div>

            {selectedCarpeta.estado === 'prestado' ? (
              <div className="mb-5 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-sm">
                Carpeta prestada — no se puede editar ni agregar documentos.
              </div>
            ) : (
              <div className="flex items-start gap-3 mb-5">
                <div className="flex-1">
                  <textarea value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 placeholder:text-surface-500 dark:placeholder:text-sepia-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 transition-all text-sm resize-none"
                    rows={1}
                  />
                  {editError && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{editError}</p>}
                </div>
                <button onClick={handleGuardarEdicion} disabled={saving}
                  className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-dark-500 dark:to-brand-dark-600 text-white font-medium shadow-md text-xs hover:from-brand-500 hover:to-brand-400 dark:hover:from-brand-dark-600 dark:hover:to-brand-dark-500 transition-all disabled:opacity-50"
                >
                  {saving ? '...' : 'Guardar'}
                </button>
              </div>
            )}

            <div className="glass-card rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-surface-600 dark:text-sepia-500">Documentos ({selectedCarpeta.documentos?.length ?? 0})</p>
                {selectedCarpeta.estado !== 'prestado' && hasPerm('gestionar_documentos') && (
                  <button onClick={openDocForm}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-dark-500 dark:to-brand-dark-600 text-white font-medium shadow-md text-xs hover:from-brand-500 hover:to-brand-400 dark:hover:from-brand-dark-600 dark:hover:to-brand-dark-500 transition-all"
                  >
                    <Plus size={14} />
                    Nuevo Documento
                  </button>
                )}
              </div>

              {showDocForm && (
                <div className="mb-4 p-4 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-brand-200 dark:border-brand-dark-600/30 space-y-3">
                  <input type="text" placeholder="Código del documento *" value={docCodigo}
                    onChange={(e) => setDocCodigo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 placeholder:text-surface-500 dark:placeholder:text-sepia-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 transition-all text-sm"
                  />
                  <input type="text" placeholder="Título del documento *" value={DocTitulo}
                    onChange={(e) => setDocTitulo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 placeholder:text-surface-500 dark:placeholder:text-sepia-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 transition-all text-sm"
                  />
                  <input type="text" placeholder="Tipo de documento (ej. Informe, Contrato, Carta) *" value={docTipo}
                    onChange={(e) => setDocTipo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 placeholder:text-surface-500 dark:placeholder:text-sepia-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 transition-all text-sm"
                  />
                  <div ref={personaRef} className="relative">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 focus-within:ring-2 focus-within:ring-brand-400/50 dark:focus-within:ring-brand-dark-500/50 transition-all">
                      <UserCheck size={16} className="text-surface-500 dark:text-sepia-500 shrink-0" />
                      <input type="text" placeholder="Propietario (persona o institución)" value={docPropietario}
                        onChange={(e) => handlePersonaSearch(e.target.value)}
                        className="flex-1 bg-transparent text-surface-800 dark:text-sepia-200 placeholder:text-surface-500 dark:placeholder:text-sepia-500 focus:outline-none text-sm" />
                    </div>
                    {showPersonaDropdown && (
                      <div className="absolute z-50 mt-1 w-full rounded-xl bg-white dark:bg-sepia-800 border border-white/40 dark:border-sepia-700/40 shadow-lg overflow-hidden">
                        {personaResults.map((p) => (
                          <button key={p.id} type="button" onClick={() => selectPersona(p)}
                            className="w-full text-left px-4 py-2.5 text-sm text-surface-800 dark:text-sepia-200 hover:bg-brand-50 dark:hover:bg-brand-dark-600/20 transition-colors border-b border-white/10 dark:border-sepia-700/20 last:border-b-0"
                          >
                            <span className="font-medium">{p.nombre} {p.apellido}</span>
                            <span className="text-surface-500 dark:text-sepia-500 ml-2 text-xs">CI: {p.ci}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {docError && <p className="text-xs text-red-600 dark:text-red-400">{docError}</p>}
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowDocForm(false)}
                      className="px-4 py-2 rounded-xl text-surface-600 dark:text-sepia-400 bg-white/60 dark:bg-sepia-800/60 border border-white/80 dark:border-sepia-700/60 hover:bg-white dark:hover:bg-sepia-800 transition-colors text-xs font-medium"
                    >
                      Cancelar
                    </button>
                    <button onClick={handleCrearDocumento}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-dark-500 dark:to-brand-dark-600 text-white font-medium shadow-md text-xs"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              )}

              {editingDoc && (
                <div className="mb-4 p-4 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-brand-200 dark:border-brand-dark-600/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-surface-800 dark:text-sepia-200">Editar Documento</p>
                    <button onClick={closeEditDoc}
                      className="p-1 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    ><X size={14} /></button>
                  </div>
                  <input type="text" placeholder="Código del documento *" value={editDocCodigo}
                    onChange={(e) => setEditDocCodigo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 placeholder:text-surface-500 dark:placeholder:text-sepia-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 transition-all text-sm"
                  />
                  <input type="text" placeholder="Título del documento *" value={editDocTitulo}
                    onChange={(e) => setEditDocTitulo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 placeholder:text-surface-500 dark:placeholder:text-sepia-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 transition-all text-sm"
                  />
                  <input type="text" placeholder="Tipo de documento (ej. Informe, Contrato, Carta) *" value={editDocTipo}
                    onChange={(e) => setEditDocTipo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 placeholder:text-surface-500 dark:placeholder:text-sepia-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 transition-all text-sm"
                  />
                  <input type="text" placeholder="Propietario (persona o institución)" value={editDocPropietario}
                    onChange={(e) => setEditDocPropietario(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/60 dark:bg-sepia-800/60 border border-white/40 dark:border-sepia-700/40 text-surface-800 dark:text-sepia-200 placeholder:text-surface-500 dark:placeholder:text-sepia-500 focus:outline-none focus:ring-2 focus:ring-brand-400/50 dark:focus:ring-brand-dark-500/50 transition-all text-sm"
                  />
                  {editDocError && <p className="text-xs text-red-600 dark:text-red-400">{editDocError}</p>}
                  <div className="flex justify-end gap-2">
                    <button onClick={closeEditDoc}
                      className="px-4 py-2 rounded-xl text-surface-600 dark:text-sepia-400 bg-white/60 dark:bg-sepia-800/60 border border-white/80 dark:border-sepia-700/60 hover:bg-white dark:hover:bg-sepia-800 transition-colors text-xs font-medium"
                    >Cancelar</button>
                    <button onClick={handleEditDoc}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 dark:from-brand-dark-500 dark:to-brand-dark-600 text-white font-medium shadow-md text-xs"
                    >Guardar</button>
                  </div>
                </div>
              )}

              {selectedCarpeta.documentos && selectedCarpeta.documentos.length > 0 ? (
                <div className="space-y-2">
                  {selectedCarpeta.documentos.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-sepia-800/50 border border-white/40 dark:border-sepia-700/40">
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="font-semibold text-surface-800 dark:text-sepia-200 text-sm truncate">{doc.titulo}</p>
                        <p className="text-xs text-surface-500 dark:text-sepia-500 mt-0.5">
                          {doc.tipoDoc} · {doc.codigoDoc}
                          {doc.propietario && <span className="ml-2 text-brand-600 dark:text-brand-dark-400">· {doc.propietario}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {selectedCarpeta.estado !== 'prestado' && hasPerm('gestionar_documentos') && (
                          <button onClick={() => openEditDoc(doc)}
                            className="p-1.5 rounded-lg text-surface-500 dark:text-sepia-500 hover:text-brand-600 dark:hover:text-brand-dark-400 hover:bg-brand-50 dark:hover:bg-brand-dark-600/20 transition-colors"
                            title="Editar documento"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                        <span className="text-xs text-surface-500 dark:text-sepia-500">{doc.fechaIngre}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-surface-500 dark:text-sepia-500 text-center py-4">Sin documentos</p>
              )}
            </div>

            {historialCarpeta.length > 0 && (
              <div className="glass-card rounded-xl p-4">
                <p className="text-xs font-semibold text-surface-600 dark:text-sepia-500 mb-3">Historial de préstamos</p>
                <div className="space-y-2">
                  {historialCarpeta.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-white/50 dark:bg-sepia-800/50 border border-white/40 dark:border-sepia-700/40">
                      <div>
                        <p className="font-semibold text-surface-800 dark:text-sepia-200 text-sm">
                          {p.persona.nombre} {p.persona.apellido}
                        </p>
                        <p className="text-xs text-surface-500 dark:text-sepia-500">{p.persona.ci}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-surface-600 dark:text-sepia-500">Hasta: {p.fechaLimite}</p>
                        <p className="text-xs text-surface-500 dark:text-sepia-500">{p.fechaPrest}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
