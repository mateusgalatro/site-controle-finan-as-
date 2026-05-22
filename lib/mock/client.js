'use client'

function store() {
  if (typeof window === 'undefined') {
    return { get: () => null, set: () => {}, remove: () => {} }
  }
  return {
    get(key) { try { return JSON.parse(localStorage.getItem(key)) } catch { return null } },
    set(key, val) { localStorage.setItem(key, JSON.stringify(val)) },
    remove(key) { localStorage.removeItem(key) },
  }
}

function genId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function getSession() {
  return store().get('mock_session')
}

function getUsers() {
  return store().get('mock_users') || []
}

function fkField(joinTable) {
  const singular = joinTable.endsWith('ies')
    ? joinTable.slice(0, -3) + 'y'
    : joinTable.endsWith('s') ? joinTable.slice(0, -1) : joinTable
  return `${singular}_id`
}

class QueryBuilder {
  constructor(table) {
    this._table = table
    this._op = 'select'
    this._filters = []
    this._order = null
    this._limitN = null
    this._single = false
    this._insertPayload = null
    this._updatePayload = null
    this._returnData = false
    this._selectFields = null
  }

  select(fields) {
    if (this._op === 'select') {
      this._selectFields = fields || null
    } else {
      this._returnData = true
    }
    return this
  }

  insert(payload) { this._op = 'insert'; this._insertPayload = payload; return this }
  update(payload) { this._op = 'update'; this._updatePayload = payload; return this }
  delete() { this._op = 'delete'; return this }

  eq(field, value) { this._filters.push({ op: 'eq', field, value }); return this }
  gte(field, value) { this._filters.push({ op: 'gte', field, value }); return this }
  lte(field, value) { this._filters.push({ op: 'lte', field, value }); return this }
  order(field, opts = {}) { this._order = { field, asc: opts.ascending !== false }; return this }
  limit(n) { this._limitN = n; return this }
  single() { this._single = true; return this }

  _rows() { return store().get(`mock_${this._table}`) || [] }
  _save(rows) { store().set(`mock_${this._table}`, rows) }

  _match(row) {
    return this._filters.every(f => {
      if (f.op === 'eq') return String(row[f.field]) === String(f.value)
      if (f.op === 'gte') return row[f.field] >= f.value
      if (f.op === 'lte') return row[f.field] <= f.value
      return true
    })
  }

  _joinRows(rows) {
    if (!this._selectFields || this._selectFields === '*') return rows
    const joinRe = /(\w+)\(([^)]+)\)/g
    const joins = []
    let m
    while ((m = joinRe.exec(this._selectFields)) !== null) {
      joins.push({ table: m[1], fields: m[2].split(',').map(s => s.trim()) })
    }
    if (!joins.length) return rows

    return rows.map(row => {
      const out = { ...row }
      for (const j of joins) {
        const related = (store().get(`mock_${j.table}`) || []).find(r => r.id === row[fkField(j.table)])
        out[j.table] = related ? Object.fromEntries(j.fields.map(f => [f, related[f]])) : null
      }
      return out
    })
  }

  async _exec() {
    let rows = this._rows()

    if (this._op === 'select') {
      rows = rows.filter(r => this._match(r))
      if (this._order) {
        const { field, asc } = this._order
        rows.sort((a, b) => {
          const [va, vb] = [a[field], b[field]]
          return asc ? (va < vb ? -1 : va > vb ? 1 : 0) : (va > vb ? -1 : va < vb ? 1 : 0)
        })
      }
      if (this._limitN != null) rows = rows.slice(0, this._limitN)
      rows = this._joinRows(rows)
      if (this._single) {
        const row = rows[0] ?? null
        return { data: row, error: row ? null : { message: 'Not found' } }
      }
      return { data: rows, error: null }
    }

    if (this._op === 'insert') {
      const items = Array.isArray(this._insertPayload) ? this._insertPayload : [this._insertPayload]
      const newRows = items.map(p => ({ id: genId(), created_at: new Date().toISOString(), ...p }))
      this._save([...rows, ...newRows])
      if (this._single) return { data: newRows[0], error: null }
      if (this._returnData) return { data: newRows, error: null }
      return { data: null, error: null }
    }

    if (this._op === 'update') {
      this._save(rows.map(r => this._match(r) ? { ...r, ...this._updatePayload } : r))
      return { data: null, error: null }
    }

    if (this._op === 'delete') {
      const deleted = rows.filter(r => this._match(r))
      this._save(rows.filter(r => !this._match(r)))
      return { data: deleted, error: null }
    }

    return { data: null, error: null }
  }

  then(resolve, reject) {
    return this._exec().then(resolve, reject)
  }
}

export function createMockClient() {
  return {
    auth: {
      async getUser() {
        const user = getSession()
        return { data: { user: user ?? null }, error: null }
      },

      async signInWithPassword({ email, password }) {
        const found = getUsers().find(u => u.email === email && u.password === password)
        if (!found) return { data: null, error: { message: 'Email ou senha incorretos.' } }
        const user = { id: found.id, email: found.email, user_metadata: found.user_metadata }
        store().set('mock_session', user)
        return { data: { user, session: { user } }, error: null }
      },

      async signUp({ email, password, options }) {
        const users = getUsers()
        if (users.find(u => u.email === email)) {
          return { data: { user: null, session: null }, error: { message: 'Email já cadastrado.' } }
        }
        const newUser = {
          id: genId(),
          email,
          password,
          user_metadata: options?.data || {},
          created_at: new Date().toISOString(),
        }
        store().set('mock_users', [...users, newUser])
        const user = { id: newUser.id, email: newUser.email, user_metadata: newUser.user_metadata }
        store().set('mock_session', user)
        return { data: { user, session: { user } }, error: null }
      },

      async signOut() {
        store().remove('mock_session')
        return { error: null }
      },

      onAuthStateChange(callback) {
        const user = getSession()
        setTimeout(() => callback('INITIAL_SESSION', user ? { user } : null), 0)
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
    },

    from(table) {
      return new QueryBuilder(table)
    },
  }
}
