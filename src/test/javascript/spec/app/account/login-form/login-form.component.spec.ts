import { shallowMount, createLocalVue, Wrapper } from '@vue/test-utils';
import axios from 'axios';
import AccountService from '@/account/account.service';
import router from '@/router';
import TranslationService from '@/locale/translation.service';

import * as config from '@/shared/config/config';
import LoginForm from '@/account/login-form/login-form.vue';
import LoginFormClass from '@/account/login-form/login-form.component';

const localVue = createLocalVue();
localVue.component('el-form', {});
localVue.component('el-form-item', {});
localVue.component('el-input', {});
localVue.component('el-tabs', {});
localVue.component('el-tab-pane', {});
localVue.component('el-button', {});
localVue.component('el-checkbox', {});
localVue.component('el-link', {});
const mockedAxios: any = axios;

config.initVueApp(localVue);
const i18n = config.initI18N(localVue);
const store = config.initVueXStore(localVue);

jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

describe('LoginForm Component', () => {
  let wrapper: Wrapper<LoginFormClass>;
  let loginForm: LoginFormClass;

  beforeEach(() => {
    mockedAxios.get.mockReset();
    mockedAxios.get.mockReturnValue(Promise.resolve({}));
    mockedAxios.post.mockReset();

    wrapper = shallowMount<LoginFormClass>(LoginForm, {
      store,
      i18n,
      localVue,
      provide: {
        accountService: () => new AccountService(store, new TranslationService(store, i18n), router),
      },
    });
    loginForm = wrapper.vm;
  });

  it('should not store token if authentication is KO', async () => {
    // GIVEN
    loginForm.login = 'login';
    loginForm.password = 'pwd';
    loginForm.rememberMe = true;
    mockedAxios.post.mockReturnValue(Promise.reject());

    // WHEN
    loginForm.doLogin();
    await loginForm.$nextTick();

    // THEN
    expect(mockedAxios.post).toHaveBeenCalledWith('api/authenticate', {
      username: 'login',
      password: 'pwd',
      rememberMe: true,
    });
    await loginForm.$nextTick();
    expect(loginForm.authenticationError).toBeTruthy();
  });

  it('should store token if authentication is OK', async () => {
    // GIVEN
    loginForm.login = 'login';
    loginForm.password = 'pwd';
    loginForm.rememberMe = true;
    const jwtSecret = 'jwt-secret';
    mockedAxios.post.mockReturnValue(Promise.resolve({ headers: { authorization: 'Bearer ' + jwtSecret } }));

    // WHEN
    loginForm.doLogin();
    await loginForm.$nextTick();

    // THEN
    expect(mockedAxios.post).toHaveBeenCalledWith('api/authenticate', {
      username: 'login',
      password: 'pwd',
      rememberMe: true,
    });

    expect(loginForm.authenticationError).toBeFalsy();
    expect(localStorage.getItem('lgp-authenticationToken')).toEqual(jwtSecret);
  });

  it('should store token if authentication is OK in session', async () => {
    // GIVEN
    loginForm.login = 'login';
    loginForm.password = 'pwd';
    loginForm.rememberMe = false;
    const jwtSecret = 'jwt-secret';
    mockedAxios.post.mockReturnValue(Promise.resolve({ headers: { authorization: 'Bearer ' + jwtSecret } }));

    // WHEN
    loginForm.doLogin();
    await loginForm.$nextTick();

    // THEN
    expect(mockedAxios.post).toHaveBeenCalledWith('api/authenticate', {
      username: 'login',
      password: 'pwd',
      rememberMe: false,
    });

    expect(loginForm.authenticationError).toBeFalsy();
    expect(sessionStorage.getItem('lgp-authenticationToken')).toEqual(jwtSecret);
  });
});
