
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from 'firebase/auth';
import { Unsubscribe } from 'firebase/firestore';

import { FirebaseService } from './services/firebase.service';
import {
  Aviso,
  CategoriaAviso,
  CATEGORIAS_AVISO
} from './models/aviso.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  usuario: User | null = null;
  avisos: Aviso[] = [];
  categorias = CATEGORIAS_AVISO;

  email = '';
  senha = '';
  confirmarSenha = '';

  modoCadastro = false;

  // A tela não fica presa esperando o Firebase.
  carregando = false;
  enviando = false;

  erro = '';
  mensagem = '';

  tituloAviso = '';
  conteudoAviso = '';
  categoriaAviso: CategoriaAviso = 'Avisos Gerais';
  categoriaSelecionada: CategoriaAviso | 'Todas' = 'Todas';

  private pararUsuario?: Unsubscribe;
  private pararAvisos?: Unsubscribe;

  constructor(private firebase: FirebaseService) {}

  ngOnInit(): void {
    // A tela de login já fica disponível antes desta resposta.
    this.carregando = false;

    try {
      this.pararUsuario = this.firebase.observarUsuario((usuario) => {
        this.usuario = usuario;
        this.carregando = false;

        this.pararAvisos?.();
        this.pararAvisos = undefined;
        this.avisos = [];

        if (!usuario) {
          return;
        }

        this.pararAvisos = this.firebase.observarAvisos(
          usuario.uid,
          (avisos) => {
            this.avisos = avisos;
          },
          (erro) => {
            console.error('Erro ao carregar avisos:', erro);
            this.erro =
              'Não foi possível carregar os avisos. Verifique as regras do Firestore.';
          }
        );
      });
    } catch (erro) {
      console.error('Erro ao iniciar autenticação:', erro);
      this.carregando = false;
      this.erro =
        'Falha ao iniciar o Firebase. Confira as configurações do projeto.';
    }
  }

  ngOnDestroy(): void {
    this.pararUsuario?.();
    this.pararAvisos?.();
  }

  get avisosFiltrados(): Aviso[] {
    if (this.categoriaSelecionada === 'Todas') {
      return this.avisos;
    }

    return this.avisos.filter(
      aviso => aviso.categoria === this.categoriaSelecionada
    );
  }

  get totalFixados(): number {
    return this.avisos.filter(aviso => aviso.fixado).length;
  }

  alternarModo(): void {
    this.modoCadastro = !this.modoCadastro;
    this.erro = '';
    this.mensagem = '';
    this.senha = '';
    this.confirmarSenha = '';
  }

  async entrarOuCadastrar(): Promise<void> {
    this.erro = '';
    this.mensagem = '';

    const email = this.email.trim();

    if (!email || !this.senha) {
      this.erro = 'Preencha o e-mail e a senha.';
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.erro = 'Digite um endereço de e-mail válido.';
      return;
    }

    if (this.senha.length < 6) {
      this.erro = 'A senha deve ter pelo menos 6 caracteres.';
      return;
    }

    if (this.modoCadastro && this.senha !== this.confirmarSenha) {
      this.erro = 'As senhas não coincidem.';
      return;
    }

    this.enviando = true;

    try {
      if (this.modoCadastro) {
        await this.firebase.cadastrar(email, this.senha);
        this.mensagem = 'Cadastro realizado com sucesso!';
      } else {
        await this.firebase.entrar(email, this.senha);
      }

      this.senha = '';
      this.confirmarSenha = '';
    } catch (erro: unknown) {
      console.error('Erro de autenticação:', erro);
      this.erro = this.traduzirErro(erro);
    } finally {
      this.enviando = false;
    }
  }

  async entrarComGoogle(): Promise<void> {
    this.erro = '';
    this.mensagem = '';
    this.enviando = true;

    try {
      await this.firebase.entrarComGoogle();
    } catch (erro: unknown) {
      console.error('Erro ao entrar com Google:', erro);
      this.erro = this.traduzirErro(erro);
    } finally {
      this.enviando = false;
    }
  }

  async sairDaConta(): Promise<void> {
    this.erro = '';

    try {
      await this.firebase.sairDaConta();
      this.email = '';
      this.senha = '';
      this.confirmarSenha = '';
    } catch (erro: unknown) {
      this.erro = this.traduzirErro(erro);
    }
  }

  async adicionarAviso(): Promise<void> {
    this.erro = '';
    this.mensagem = '';

    if (!this.usuario) {
      this.erro = 'Entre na sua conta para publicar avisos.';
      return;
    }

    const titulo = this.tituloAviso.trim();
    const conteudo = this.conteudoAviso.trim();

    if (!titulo || !conteudo) {
      this.erro = 'Preencha o título e o conteúdo do aviso.';
      return;
    }

    try {
      await this.firebase.adicionarAviso(this.usuario.uid, {
        titulo,
        conteudo,
        categoria: this.categoriaAviso,
        fixado: false,
        criadoEm: Date.now()
      });

      this.tituloAviso = '';
      this.conteudoAviso = '';
      this.categoriaAviso = 'Avisos Gerais';
      this.mensagem = 'Aviso publicado!';
    } catch (erro: unknown) {
      console.error('Erro ao publicar aviso:', erro);
      this.erro = 'Não foi possível publicar. Confira as regras do Firestore.';
    }
  }

  async alternarFixado(aviso: Aviso): Promise<void> {
    if (!this.usuario) {
      return;
    }

    const fixar = !aviso.fixado;

    if (fixar && this.totalFixados >= 2) {
      this.erro = 'Você pode fixar no máximo 2 avisos.';
      return;
    }

    try {
      await this.firebase.alterarFixado(
        this.usuario.uid,
        aviso.id,
        fixar
      );
      this.erro = '';
    } catch (erro: unknown) {
      console.error('Erro ao fixar aviso:', erro);
      this.erro = 'Não foi possível alterar esse aviso.';
    }
  }

  async excluirAviso(aviso: Aviso): Promise<void> {
    if (!this.usuario) {
      return;
    }

    if (!confirm(`Deseja excluir "${aviso.titulo}"?`)) {
      return;
    }

    try {
      await this.firebase.removerAviso(
        this.usuario.uid,
        aviso.id
      );
      this.mensagem = 'Aviso excluído.';
      this.erro = '';
    } catch (erro: unknown) {
      console.error('Erro ao excluir aviso:', erro);
      this.erro = 'Não foi possível excluir esse aviso.';
    }
  }

  private traduzirErro(erro: unknown): string {
    const codigo =
      (erro as { code?: string } | null)?.code ?? '';

    const mensagens: Record<string, string> = {
      'auth/invalid-email':
        'O e-mail informado é inválido.',
      'auth/user-not-found':
        'Não existe uma conta com esse e-mail.',
      'auth/wrong-password':
        'Senha incorreta.',
      'auth/invalid-credential':
        'E-mail ou senha incorretos.',
      'auth/email-already-in-use':
        'Esse e-mail já está cadastrado. Tente fazer login.',
      'auth/weak-password':
        'A senha deve ter pelo menos 6 caracteres.',
      'auth/popup-closed-by-user':
        'A janela de login do Google foi fechada.',
      'auth/popup-blocked':
        'O navegador bloqueou a janela do Google.',
      'auth/unauthorized-domain':
        'O domínio atual não está autorizado no Firebase.',
      'auth/network-request-failed':
        'Falha de conexão. Verifique sua internet.',
      'auth/too-many-requests':
        'Muitas tentativas. Aguarde e tente novamente.',
      'auth/operation-not-allowed':
        'Ative o método de login nas configurações do Firebase.'
    };

    return mensagens[codigo] ??
      `Não foi possível concluir a operação. Código: ${codigo || 'erro desconhecido'}.`;
  }
}
