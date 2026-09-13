import { History } from 'history';
import { NavigationManager } from './navigation';

function navigationAt(pathname: string, search: string) {
    const replace = jest.fn();
    const push = jest.fn();
    const history = { location: { pathname, search }, replace, push } as unknown as History;
    return { navigation: new NavigationManager(history), replace, push };
}

describe('NavigationManager.goto', () => {
    it('replaces the URL with the merged query parameters', () => {
        const { navigation, replace } = navigationAt('/applications', '?proj=default');
        navigation.goto('.', { proj: 'other' }, { replace: true });
        expect(replace).toHaveBeenCalledWith('/applications?proj=other');
    });

    it('pushes when replace is not requested', () => {
        const { navigation, push } = navigationAt('/applications', '');
        navigation.goto('.', { proj: 'default' });
        expect(push).toHaveBeenCalledWith('/applications?proj=default');
    });

    describe('skipIfUnchanged', () => {
        it('skips the navigation when every parameter already has that value', () => {
            const { navigation, replace } = navigationAt('/applications', '?proj=default&health=Healthy');
            navigation.goto('.', { proj: 'default', health: 'Healthy' }, { replace: true, skipIfUnchanged: true });
            expect(replace).not.toHaveBeenCalled();
        });

        it('navigates when a value changes', () => {
            const { navigation, replace } = navigationAt('/applications', '?proj=default');
            navigation.goto('.', { proj: 'other' }, { replace: true, skipIfUnchanged: true });
            expect(replace).toHaveBeenCalledWith('/applications?proj=other');
        });

        it('navigates when a parameter is added or removed', () => {
            const added = navigationAt('/applications', '?proj=default');
            added.navigation.goto('.', { showFavorites: 'true' }, { replace: true, skipIfUnchanged: true });
            expect(added.replace).toHaveBeenCalled();

            const removed = navigationAt('/applications', '?proj=default');
            removed.navigation.goto('.', { proj: null }, { replace: true, skipIfUnchanged: true });
            expect(removed.replace).toHaveBeenCalled();
        });

        it('ignores parameters the caller did not pass', () => {
            const { navigation, replace } = navigationAt('/applications', '?proj=default&view=tiles');
            navigation.goto('.', { proj: 'default' }, { replace: true, skipIfUnchanged: true });
            expect(replace).not.toHaveBeenCalled();
        });

        it('ignores the order of the query parameters', () => {
            const { navigation, replace } = navigationAt('/applications', '?health=Healthy&proj=default');
            navigation.goto('.', { proj: 'default', health: 'Healthy' }, { replace: true, skipIfUnchanged: true });
            expect(replace).not.toHaveBeenCalled();
        });

        it('compares every entry of an array parameter', () => {
            const unchanged = navigationAt('/applications', '?type=git&type=helm');
            unchanged.navigation.goto('.', { type: ['git', 'helm'] }, { replace: true, skipIfUnchanged: true });
            expect(unchanged.replace).not.toHaveBeenCalled();

            const changed = navigationAt('/applications', '?type=git&type=helm');
            changed.navigation.goto('.', { type: ['git'] }, { replace: true, skipIfUnchanged: true });
            expect(changed.replace).toHaveBeenCalled();
        });

        it('navigates when the path changes', () => {
            const { navigation, replace } = navigationAt('/applications', '?proj=default');
            navigation.goto('/settings', { proj: 'default' }, { replace: true, skipIfUnchanged: true });
            expect(replace).toHaveBeenCalledWith('/settings?proj=default');
        });

        it('navigates by default, so existing callers keep their behavior', () => {
            const { navigation, replace } = navigationAt('/applications', '?proj=default');
            navigation.goto('.', { proj: 'default' }, { replace: true });
            expect(replace).toHaveBeenCalledWith('/applications?proj=default');
        });
    });
});
