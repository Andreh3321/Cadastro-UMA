import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { buscarUsuarios, criarUsuario, editarUsuario, excluirUsuario } from "../api";

const ROLE_LABELS = {
    admin: "Administrador",
    secretario: "Secretário",
    lider: "Líder",
    eventos: "Eventos",
};

const EMPTY_FORM = { nome: "", login: "", senha: "", role: "eventos" };

function initials(nome = "") {
    return nome.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

export default function Administracao() {
    const { user } = useAuth();
    const [usuarios, setUsuarios] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState(null);
    const [busca, setBusca] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    async function loadUsers() {
        setLoading(true);
        try {
            setUsuarios(await buscarUsuarios());
        } catch (error) {
            setMessage({ type: "error", text: error.message });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadUsers(); }, []);

    const filteredUsers = useMemo(() => {
        const term = busca.trim().toLowerCase();
        if (!term) return usuarios;
        return usuarios.filter((item) => `${item.nome} ${item.login} ${item.role}`.toLowerCase().includes(term));
    }, [usuarios, busca]);

    function updateField(event) {
        setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    }

    function startEdit(item) {
        setEditingId(item.id);
        setForm({ nome: item.nome, login: item.login, senha: "", role: item.role });
        setMessage(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function cancelEdit() {
        setEditingId(null);
        setForm(EMPTY_FORM);
    }

    async function submit(event) {
        event.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            if (editingId) {
                const payload = { nome: form.nome, role: form.role };
                if (form.senha.trim()) payload.senha = form.senha;
                await editarUsuario(editingId, payload);
                setMessage({ type: "success", text: "Usuário atualizado com sucesso." });
            } else {
                await criarUsuario(form);
                setMessage({ type: "success", text: "Usuário criado com sucesso." });
            }
            cancelEdit();
            await loadUsers();
        } catch (error) {
            setMessage({ type: "error", text: error.message });
        } finally {
            setSaving(false);
        }
    }

    async function toggleActive(item) {
        setMessage(null);
        try {
            await editarUsuario(item.id, { ativo: !item.ativo });
            setUsuarios((current) => current.map((entry) => entry.id === item.id ? { ...entry, ativo: item.ativo ? 0 : 1 } : entry));
            setMessage({ type: "success", text: item.ativo ? "Acesso desativado." : "Acesso reativado." });
        } catch (error) {
            setMessage({ type: "error", text: error.message });
        }
    }

    async function removeUser(item) {
        if (!window.confirm(`Excluir o usuário ${item.nome}? Essa ação não pode ser desfeita.`)) return;
        setMessage(null);
        try {
            await excluirUsuario(item.id);
            setUsuarios((current) => current.filter((entry) => entry.id !== item.id));
            setMessage({ type: "success", text: "Usuário excluído com sucesso." });
        } catch (error) {
            setMessage({ type: "error", text: error.message });
        }
    }

    return (
        <main className="pagina administracao">
            <div className="pagina-header">
                <div>
                    <span className="eyebrow">Controle de acesso</span>
                    <h1>Administração</h1>
                    <p>Cadastre usuários e defina o que cada pessoa pode acessar.</p>
                </div>
                <Link className="btn-primary admin-voltar" to="/">Voltar ao início</Link>
            </div>

            {message && <div className={`admin-alerta ${message.type}`} role="status">{message.text}</div>}

            <section className="admin-layout">
                <div className="card-admin admin-form-card">
                    <div className="admin-card-heading">
                        <div>
                            <span className="eyebrow">{editingId ? "Editar acesso" : "Novo acesso"}</span>
                            <h2>{editingId ? "Atualizar usuário" : "Cadastrar usuário"}</h2>
                        </div>
                        {editingId && <button className="btn-link" type="button" onClick={cancelEdit}>Cancelar</button>}
                    </div>
                    <form className="admin-form" onSubmit={submit}>
                        <label>Nome completo<input name="nome" value={form.nome} onChange={updateField} required maxLength={255} /></label>
                        <label>Login<input name="login" value={form.login} onChange={updateField} required={!editingId} disabled={Boolean(editingId)} maxLength={120} autoCapitalize="none" /></label>
                        <label>{editingId ? "Nova senha (opcional)" : "Senha"}<input name="senha" type="password" value={form.senha} onChange={updateField} required={!editingId} minLength={8} placeholder={editingId ? "Deixe vazio para manter" : "Mínimo de 8 caracteres"} /></label>
                        <label>Nível de acesso<select name="role" value={form.role} onChange={updateField}><option value="admin">Administrador</option><option value="secretario">Secretário</option><option value="lider">Líder</option><option value="eventos">Eventos</option></select></label>
                        <button className="btn-primary admin-submit" type="submit" disabled={saving}>{saving ? "Salvando..." : editingId ? "Salvar alterações" : "Criar usuário"}</button>
                    </form>
                    <div className="admin-help"><strong>Como escolher o nível?</strong><span><b>Administrador:</b> gerencia usuários e tem acesso completo.</span><span><b>Secretário/Líder:</b> acessam jovens, eventos, chamada e ranking.</span><span><b>Eventos:</b> acessa jovens e eventos, sem ranking ou chamada.</span></div>
                </div>

                <div className="card-admin admin-list-card">
                    <div className="admin-card-heading admin-list-heading">
                        <div><span className="eyebrow">Acessos cadastrados</span><h2>Usuários <small>{usuarios.length}</small></h2></div>
                        <input className="admin-search" value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Buscar usuário..." aria-label="Buscar usuário" />
                    </div>
                    {loading ? <div className="admin-empty">Carregando usuários...</div> : filteredUsers.length === 0 ? <div className="admin-empty">Nenhum usuário encontrado.</div> : <div className="usuarios-lista">
                        {filteredUsers.map((item) => <article className={`usuario-row ${!item.ativo ? "inativo" : ""}`} key={item.id}>
                            <div className="usuario-avatar">{initials(item.nome)}</div>
                            <div className="usuario-dados"><strong>{item.nome}{item.id === user?.id && <em> você</em>}</strong><span>@{item.login}</span></div>
                            <span className={`role-badge role-${item.role}`}>{ROLE_LABELS[item.role]}</span>
                            <span className={`status-badge ${item.ativo ? "ativo" : "desativado"}`}>{item.ativo ? "Ativo" : "Desativado"}</span>
                            <div className="usuario-acoes"><button type="button" className="btn-table" onClick={() => startEdit(item)}>Editar</button><button type="button" className="btn-table" onClick={() => toggleActive(item)}>{item.ativo ? "Desativar" : "Ativar"}</button><button type="button" className="btn-table danger" onClick={() => removeUser(item)} disabled={item.id === user?.id}>Excluir</button></div>
                        </article>)}
                    </div>}
                </div>
            </section>
        </main>
    );
}
