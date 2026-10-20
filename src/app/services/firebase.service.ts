import { Injectable } from '@angular/core';

import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';

import {
  Auth,
  User,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'firebase/auth';

import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  Unsubscribe
} from 'firebase/firestore';

import { environment } from '../../environments/environment';
import {
  Aviso,
  CategoriaAviso,
  CATEGORIAS_AVISO
} from '../models/aviso.models';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private readonly app: FirebaseApp;
  private readonly auth: Auth;
  private readonly db: Firestore;

  constructor() {
    this.app = getApps().length
      ? getApp()
      : initializeApp(environment.firebase);

    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
  }

  observarUsuario(
    callback: (usuario: User | null) => void
  ): Unsubscribe {
    return onAuthStateChanged(this.auth, callback);
  }

  entrar(email: string, senha: string) {
    return signInWithEmailAndPassword(
      this.auth,
      email.trim(),
      senha
    );
  }

  cadastrar(email: string, senha: string) {
    return createUserWithEmailAndPassword(
      this.auth,
      email.trim(),
      senha
    );
  }

  entrarComGoogle() {
    const provedor = new GoogleAuthProvider();
    provedor.setCustomParameters({ prompt: 'select_account' });

    return signInWithPopup(this.auth, provedor);
  }

  sairDaConta() {
    return signOut(this.auth);
  }

  observarAvisos(
    usuarioId: string,
    sucesso: (avisos: Aviso[]) => void,
    falha: (erro: Error) => void
  ): Unsubscribe {
    const referencia = collection(
      this.db,
      'usuarios',
      usuarioId,
      'avisos'
    );

    const consulta = query(
      referencia,
      orderBy('criadoEm', 'desc')
    );

    return onSnapshot(
      consulta,
      (snapshot) => {
        const avisos: Aviso[] = snapshot.docs.map((documento) => {
          const dados = documento.data();
          const categoriaRecebida = dados['categoria'];

          const categoria: CategoriaAviso =
            CATEGORIAS_AVISO.includes(categoriaRecebida)
              ? categoriaRecebida
              : 'Avisos Gerais';

          return {
            id: documento.id,
            titulo: String(dados['titulo'] ?? ''),
            conteudo: String(dados['conteudo'] ?? ''),
            categoria,
            fixado: dados['fixado'] === true,
            criadoEm: Number(dados['criadoEm'] ?? Date.now())
          };
        });

        sucesso(avisos);
      },
      falha
    );
  }

  adicionarAviso(
    usuarioId: string,
    aviso: Omit<Aviso, 'id'>
  ) {
    const referencia = collection(
      this.db,
      'usuarios',
      usuarioId,
      'avisos'
    );

    return addDoc(referencia, {
      titulo: aviso.titulo,
      conteudo: aviso.conteudo,
      categoria: aviso.categoria,
      fixado: aviso.fixado,
      criadoEm: aviso.criadoEm
    });
  }

  alterarFixado(
    usuarioId: string,
    avisoId: string,
    fixado: boolean
  ) {
    const referencia = doc(
      this.db,
      'usuarios',
      usuarioId,
      'avisos',
      avisoId
    );

    return updateDoc(referencia, { fixado });
  }

  removerAviso(usuarioId: string, avisoId: string) {
    const referencia = doc(
      this.db,
      'usuarios',
      usuarioId,
      'avisos',
      avisoId
    );

    return deleteDoc(referencia);
  }
}